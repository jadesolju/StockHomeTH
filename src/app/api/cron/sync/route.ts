import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const yahooFinance = new YahooFinance();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vxfyflltpdqkddnmpwdg.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_4uyj29eoy8YuXHj4sCejPg_gEcfN1AM';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Zero-Trust: If CRON_SECRET is configured, strictly enforce bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Valid CRON_SECRET is required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Fetch a batch of stocks to update, sorted by oldest updated_at
    const { data: stocks, error: fetchError } = await supabase
      .from('stocks')
      .select('ticker, market, name, price, change, pe_ratio, dividend_yield')
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
