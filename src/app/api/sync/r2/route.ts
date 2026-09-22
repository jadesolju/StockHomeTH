import { NextRequest, NextResponse } from 'next/server';
import {
  runEgressAuditReport,
  syncMarketUniverseToR2,
  syncWeeklyNewsToR2,
  syncSupabaseFromR2Market,
  fetchMarketUniverseFromR2,
} from '@/lib/services/r2DataSyncService';
import { fetchLiveWeeklyAggregatedNews } from '@/lib/services/weeklyNewsAggregatorService';
import { getLiveWeeklyDigestIntelligence } from '@/lib/services/weeklyDigestIntelligenceService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET: Supabase Egress Audit & Cloudflare R2 Diagnostic Telemetry
 */
export async function GET(req: NextRequest) {
  try {
    const report = await runEgressAuditReport();
    return NextResponse.json({
      success: true,
      report,
    });
  } catch (err: any) {
    console.error('[Egress Audit API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to generate Egress Audit Report',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: Trigger Two-Way JSON Sync between Supabase, Market Feeds, and Cloudflare R2
 */
export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const action = body.action || 'sync_market';

    switch (action) {
      case 'sync_market': {
        const result = await syncMarketUniverseToR2();
        return NextResponse.json({
          success: true,
          action: 'sync_market',
          message: `Market universe synced to R2 (${result.itemCount} stocks, ${result.universeSizeBytes} bytes)`,
          result,
        });
      }

      case 'sync_news': {
        const [news, overview] = await Promise.all([
          fetchLiveWeeklyAggregatedNews(true),
          getLiveWeeklyDigestIntelligence(true),
        ]);
        const result = await syncWeeklyNewsToR2(news, overview);
        return NextResponse.json({
          success: true,
          action: 'sync_news',
          message: `Weekly news intelligence digest synced to R2 (${news.length} articles)`,
          result,
        });
      }

      case 'sync_supabase_from_r2': {
        const result = await syncSupabaseFromR2Market();
        return NextResponse.json({
          success: true,
          action: 'sync_supabase_from_r2',
          message: result.message,
          result,
        });
      }

      case 'full_sync': {
        const [marketRes, news, overview] = await Promise.all([
          syncMarketUniverseToR2(),
          fetchLiveWeeklyAggregatedNews(true),
          getLiveWeeklyDigestIntelligence(true),
        ]);
        const newsRes = await syncWeeklyNewsToR2(news, overview);

        return NextResponse.json({
          success: true,
          action: 'full_sync',
          message: 'Full market and news intelligence datasets synchronized to Cloudflare R2',
          market: marketRes,
          news: newsRes,
          timestamp: new Date().toISOString(),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action "${action}". Allowed actions: sync_market, sync_news, sync_supabase_from_r2, full_sync`,
          },
          { status: 400 }
        );
    }
  } catch (err: any) {
    console.error('[Sync API Error]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Error executing sync action',
      },
      { status: 500 }
    );
  }
}
