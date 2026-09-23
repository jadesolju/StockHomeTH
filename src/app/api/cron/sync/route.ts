import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';
import { getSetMarketStatus, getUsMarketStatus } from '@/lib/utils/marketHours';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const yahooFinance = new YahooFinance();

const MAX_BATCH_SIZE = 100;

function timingSafeEqual(provided: string, expected: string): boolean {
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
  // Keep the legacy service-role variable as a migration path, but never fall back to a public/anon key for writes.
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secretKey ? createClient(supabaseUrl, secretKey) : null;
}

function isAuthorizedCronRequest(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const authorization = request.headers.get('authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  return token.length > 0 && timingSafeEqual(token, cronSecret);
}

export async function GET(request: Request) {
  try {
    if (!process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'CRON_SECRET is not configured' }, { status: 503 });
    }

    if (!isAuthorizedCronRequest(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: valid cron credentials are required' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase server secret is not configured' }, { status: 503 });
    }

    const activeMarkets: string[] = [];
    if (getSetMarketStatus().isOpen) activeMarkets.push('SET', 'MAI');
    if (getUsMarketStatus().isOpen) activeMarkets.push('US');
    if (activeMarkets.length === 0) {
      return NextResponse.json({ success: true, message: 'No supported market is open', count: 0 });
    }

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit') || 50);
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_BATCH_SIZE) {
      return NextResponse.json({
        success: false,
        error: `limit must be an integer between 1 and ${MAX_BATCH_SIZE}`
      }, { status: 400 });
    }
    const limit = requestedLimit;
    
    // Fetch a batch of stocks to update, sorted by oldest updated_at
    const { data: stocks, error: fetchError } = await supabase
      .from('stocks')
      .select('ticker, market, name, price, change, pe_ratio, dividend_yield')
      .in('market', activeMarkets)
      .order('updated_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!stocks || stocks.length === 0) {
      return NextResponse.json({ success: true, message: 'No stocks to update' });
    }

    const updatedData = [];
    const symbolsToFetch = stocks.map((s: any) => {
      if (s.market === 'SET' && s.ticker) {
        return `${s.ticker}.BK`;
      }
      return s.ticker;
    }).filter(Boolean);

    if (symbolsToFetch.length > 0) {
      const results = await yahooFinance.quote(symbolsToFetch as string[]);
      const quoteArray = Array.isArray(results) ? results : results ? [results] : [];
      const quoteMap = new Map<string, any>();
      for (const quote of quoteArray) {
        if (quote && quote.symbol) {
          quoteMap.set(quote.symbol, quote);
        }
      }
      
      for (const stock of stocks as any[]) {
        const querySymbol = stock.market === 'SET' ? `${stock.ticker}.BK` : stock.ticker;
        const quote = quoteMap.get(querySymbol);
        
        const price = quote?.regularMarketPrice ?? stock.price ?? 0;
        const change = quote?.regularMarketChangePercent ?? stock.change ?? 0;

        updatedData.push({
          ticker: stock.ticker,
          name: stock.name,
          market: stock.market,
          price: price,
          change: change,
          pe_ratio: quote?.trailingPE || stock.pe_ratio || null,
          dividend_yield: quote?.trailingAnnualDividendYield || stock.dividend_yield || null,
          updated_at: new Date().toISOString()
        });
      }

      if (updatedData.length > 0) {
        const { error: upsertError } = await supabase.from('stocks').upsert(updatedData);
        if (upsertError) {
          console.error('Supabase upsert error:', upsertError);
          return NextResponse.json({ success: false, error: upsertError.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${updatedData.length} stocks.`,
      count: updatedData.length
    });
  } catch (error: any) {
    console.error('Cron sync error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
