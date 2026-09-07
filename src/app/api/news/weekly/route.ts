import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveWeeklyAggregatedNews } from '../../../../lib/services/weeklyNewsAggregatorService';
import { getLiveWeeklyDigestIntelligence } from '../../../../lib/services/weeklyDigestIntelligenceService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get('region') || 'all';
    const ticker = searchParams.get('ticker') || searchParams.get('symbol');
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';

    const [news, overview] = await Promise.all([
      fetchLiveWeeklyAggregatedNews(forceRefresh),
      getLiveWeeklyDigestIntelligence(forceRefresh)
    ]);

    let filtered = news;

    if (region !== 'all') {
      filtered = filtered.filter((n) => n.region === region);
    }

    if (ticker) {
      const cleanTicker = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
      filtered = filtered.filter((n) =>
        n.tickers.some((t) => t.toUpperCase() === cleanTicker || cleanTicker.includes(t.toUpperCase()))
      );
    }

    return NextResponse.json({
      success: true,
      source: 'live_weekly_multifeed',
      timeframe: 'weekly',
      count: filtered.length,
      overview,
      data: filtered
    });
  } catch (error: any) {
    console.warn('[Weekly News API] Error handling request:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch weekly financial news',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const [news, overview] = await Promise.all([
      fetchLiveWeeklyAggregatedNews(true),
      getLiveWeeklyDigestIntelligence(true)
    ]);

    return NextResponse.json({
      success: true,
      message: 'Weekly intelligence re-synthesized successfully',
      count: news.length,
      overview,
      data: news
    });
  } catch (error: any) {
    console.warn('[Weekly News API] POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Weekly re-synthesis failed',
      },
      { status: 500 }
    );
  }
}
