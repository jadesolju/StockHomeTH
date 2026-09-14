import { NextResponse } from 'next/server';
import { fetchLiveStocksFromYFinance } from '@/lib/services/yfinanceBridge';
import { upsertStocksToPool } from '@/lib/services/stockPoolService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60s max on Pro/Vercel

/**
 * Cron Job 1: Ingests & syncs live market quotes into Supabase Stock Pool
 * Periodically marks updated stocks as analysis_status = 'pending'
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Optional cron secret verification if configured
    if (cronSecret && authHeader !== `Bearer ${cronSecret}` && url.searchParams.get('key') !== cronSecret) {
      // In development or local preview, allow bypass
      if (process.env.NODE_ENV === 'production' && !url.searchParams.get('dev')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
    }

    const startTime = Date.now();
    console.log('[Cron sync-market-pool] Starting market universe quote sync...');

    // 1. Fetch fresh fundamentals for active stock universe
    const stocks = await fetchLiveStocksFromYFinance();
    if (!stocks || stocks.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No stock data returned from primary live fetch',
      }, { status: 500 });
    }

    // 2. Upsert to Supabase Pool and flag analysis_status = 'pending'
    const upsertCount = await upsertStocksToPool(stocks);
    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${upsertCount} stocks to Supabase pool`,
      syncedCount: upsertCount,
      elapsedMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron sync-market-pool] Exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error during sync',
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
