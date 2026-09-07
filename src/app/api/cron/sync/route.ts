import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    
    // Fetch a batch of stocks to update, sorted by oldest updated_at
    const { data: stocks, error: fetchError } = await supabase
      .from('stocks')
      .select('ticker, market, name')
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
    const symbolsToFetch = stocks.map(s => {
      if (s.market === 'SET' && s.ticker) {
        return `${s.ticker}.BK`;
      }
      return s.ticker;
    }).filter(Boolean);

    if (symbolsToFetch.length > 0) {
      const results = await yahooFinance.quote(symbolsToFetch as string[]);
      
      for (const stock of stocks) {
        const querySymbol = stock.market === 'SET' ? `${stock.ticker}.BK` : stock.ticker;
        const quote = (Array.isArray(results) ? results : [results]).find((r: any) => r.symbol === querySymbol);
        
        if (quote && quote.regularMarketPrice) {
          const change = quote.regularMarketChangePercent || 0;
          
          updatedData.push({
            ticker: stock.ticker,
            name: stock.name,
            market: stock.market,
            price: quote.regularMarketPrice,
            change: change,
            pe_ratio: quote.trailingPE || null,
            dividend_yield: quote.trailingAnnualDividendYield || null,
            updated_at: new Date().toISOString()
          });
        } else {
          // Update timestamp anyway so we don't get stuck in a loop trying to fetch invalid symbols
          updatedData.push({
            ticker: stock.ticker,
            name: stock.name,
            market: stock.market,
            updated_at: new Date().toISOString()
          });
        }
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
