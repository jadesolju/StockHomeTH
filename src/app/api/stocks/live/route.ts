import { NextRequest, NextResponse } from 'next/server';
import { fetchLiveStockFundamentals, fetchStockByTicker } from '../../../../lib/services/stockDataService';
import { getStockTags, getStockPopularityRank, DOW_JONES_30, NASDAQ_100, MAGNIFICENT_7, THAI_7_GIANTS, SET50_TICKERS, SET100_TICKERS, RECENT_IPOS } from '../../../../lib/utils/stockTagHelper';
import type { StockFundamental } from '../../../../lib/schemas/marketSchema';

/**
 * Helper to parse string values like "12.5M", "450K", "$3.2T", "—" into raw numbers
 */
function parseNumericValue(val: string | number | undefined): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val || val === '—' || val === '-') return 0;
  const str = String(val).trim().toUpperCase();
  const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return 0;
  if (str.endsWith('T')) return num * 1_000_000_000_000;
  if (str.endsWith('B')) return num * 1_000_000_000;
  if (str.endsWith('M')) return num * 1_000_000;
  if (str.endsWith('K')) return num * 1_000;
  return num;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const singleTicker = (searchParams.get('ticker') || searchParams.get('symbol') || '').toUpperCase().trim();
    const market = searchParams.get('market') || 'ALL';
    const forceLive = searchParams.get('forceLive') === 'true';

    // 1. Instant Single Stock Live Lookup (Direct from Yahoo Finance & Webull)
    if (singleTicker && (forceLive || !searchParams.has('page'))) {
      try {
        const liveStock = await fetchStockByTicker(singleTicker, market !== 'ALL' ? market : undefined, forceLive);
        if (liveStock) {
          return NextResponse.json({
            success: true,
            source: 'live_vendor',
            provider: 'yfinance_webull_bridge',
            data: liveStock,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('[stocks/live] Single live ticker query warning:', err);
      }
    }

    const page = parseInt(searchParams.get('page') || searchParams.get('chunk') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const sector = searchParams.get('sector') || 'ALL';
    const tag = searchParams.get('tag') || 'ALL';
    const search = searchParams.get('search') || searchParams.get('q') || '';
    const sortBy = searchParams.get('sortBy') || 'popular';
    const fetchAll = searchParams.get('all') === 'true';

    const allStocks = await fetchLiveStockFundamentals();

    // Calculate universe counts
    const totalCount = allStocks.length;
    const setCount = allStocks.filter((s) => s.market === 'SET').length;
    const usCount = allStocks.filter((s) => s.market === 'US').length;

    // Apply Filters
    let filtered = [...allStocks];

    if (market !== 'ALL') {
      filtered = filtered.filter((s) => s.market.toUpperCase() === market.toUpperCase());
    }

    if (sector !== 'ALL') {
      filtered = filtered.filter((s) => s.sector === sector);
    }

    if (tag !== 'ALL') {
      const targetTag = tag.toLowerCase().trim();
      filtered = filtered.filter((s) => {
        const stockTags = getStockTags(s);
        const tickerUpper = s.ticker.toUpperCase();

        if (targetTag.includes('ipo')) {
          return RECENT_IPOS.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('ipo'));
        }
        if (targetTag.includes('นางฟ้า') || targetTag.includes('thai 7')) {
          return s.market === 'SET' && (THAI_7_GIANTS.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('นางฟ้า') || t.toLowerCase().includes('thai 7')));
        }
        if (targetTag.includes('set50') || targetTag.includes('บลูชิพ')) {
          return s.market === 'SET' && (SET50_TICKERS.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('set50') || t.toLowerCase().includes('blue chip')));
        }
        if (targetTag.includes('set100') || targetTag.includes('หุ้นใหญ่')) {
          return s.market === 'SET' && (SET100_TICKERS.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('set100') || t.toLowerCase().includes('set50')));
        }
        if (targetTag.includes('sset') || targetTag.includes('mai')) {
          return s.market === 'SET' && (!SET50_TICKERS.has(tickerUpper) && !SET100_TICKERS.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('sset') || t.toLowerCase().includes('mai')));
        }
        if (targetTag.includes('magnificent') || targetTag.includes('mag 7')) {
          return s.market === 'US' && (MAGNIFICENT_7.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('magnificent')));
        }
        if (targetTag.includes('dow') || targetTag.includes('djia')) {
          return s.market === 'US' && (DOW_JONES_30.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('dow')));
        }
        if (targetTag.includes('nasdaq')) {
          return s.market === 'US' && (NASDAQ_100.has(tickerUpper) || stockTags.some((t) => t.toLowerCase().includes('nasdaq')));
        }
        if (targetTag.includes('s&p') || targetTag.includes('sp500')) {
          return s.market === 'US' && (stockTags.some((t) => t.toLowerCase().includes('s&p') || t.toLowerCase().includes('sp500')) || DOW_JONES_30.has(tickerUpper) || NASDAQ_100.has(tickerUpper));
        }
        return stockTags.some((t) => t.toLowerCase() === targetTag || t.toLowerCase().includes(targetTag));
      });
    }

    if (search.trim() !== '') {
      const q = search.toLowerCase().trim();
      const rawTicker = search.trim().toUpperCase();

      filtered = filtered.filter(
        (s) => {
          if (s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)) return true;
          const tags = getStockTags(s);
          return tags.some((t) => t.toLowerCase().includes(q));
        }
      );

      // Instant On-Demand Ticker Retrieval: If not in local list and looks like a ticker symbol, fetch immediately
      const hasExactMatch = filtered.some((s) => s.ticker.toUpperCase() === rawTicker);
      if (!hasExactMatch && /^[A-Z0-9.\-]{1,10}$/i.test(rawTicker)) {
        try {
          const onDemandStock = await fetchStockByTicker(rawTicker, market !== 'ALL' ? market : undefined);
          if (onDemandStock) {
            if (market === 'ALL' || onDemandStock.market === market) {
              filtered.unshift(onDemandStock);
            }
          }
        } catch (err) {
          console.warn('[stocks/live] On-demand ticker resolution warning:', err);
        }
      }

      // Boost exact ticker matches to the top
      filtered.sort((a, b) => {
        const aExact = a.ticker.toLowerCase() === q ? 1 : 0;
        const bExact = b.ticker.toLowerCase() === q ? 1 : 0;
        if (aExact !== bExact) return bExact - aExact;

        const aStarts = a.ticker.toLowerCase().startsWith(q) ? 1 : 0;
        const bStarts = b.ticker.toLowerCase().startsWith(q) ? 1 : 0;
        if (aStarts !== bStarts) return bStarts - aStarts;

        return parseNumericValue(b.volume) - parseNumericValue(a.volume);
      });
    } else {
      // Apply Sorting when no search query
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'popular': {
            const rankA = getStockPopularityRank(a, market);
            const rankB = getStockPopularityRank(b, market);
            if (rankA !== rankB) return rankA - rankB;

            // Secondary: Market Cap then Volume
            const capDiff = parseNumericValue(b.marketCap) - parseNumericValue(a.marketCap);
            if (capDiff !== 0) return capDiff;
            return parseNumericValue(b.volume) - parseNumericValue(a.volume);
          }
          case 'volume':
          case 'liquidity': {
            const volA = parseNumericValue(a.volume);
            const volB = parseNumericValue(b.volume);
            if (volB !== volA) return volB - volA;
            return parseNumericValue(b.marketCap) - parseNumericValue(a.marketCap);
          }
          case 'marketCap': {
            return parseNumericValue(b.marketCap) - parseNumericValue(a.marketCap);
          }
          case 'gainers':
            return b.change - a.change;
          case 'losers':
            return a.change - b.change;
          case 'aiScore':
          case 'sentiment':
            return (b.sentimentScore ?? 50) - (a.sentimentScore ?? 50);
          case 'dividend':
          case 'divYield':
            return (b.dividendYield ?? 0) - (a.dividendYield ?? 0);
          case 'peRatio':
            return (a.peRatio || 999) - (b.peRatio || 999);
          case 'marketThaiFirst':
            if (a.market !== b.market) return a.market === 'SET' ? -1 : 1;
            return parseNumericValue(b.volume) - parseNumericValue(a.volume);
          case 'marketUsFirst':
            if (a.market !== b.market) return a.market === 'US' ? -1 : 1;
            return parseNumericValue(b.volume) - parseNumericValue(a.volume);
          case 'tickerAsc':
            return a.ticker.localeCompare(b.ticker);
          case 'tickerDesc':
            return b.ticker.localeCompare(a.ticker);
          default:
            return parseNumericValue(b.volume) - parseNumericValue(a.volume);
        }
      });
    }

    if (fetchAll) {
      return NextResponse.json({
        success: true,
        page: 1,
        limit: filtered.length,
        total: filtered.length,
        totalPages: 1,
        hasMore: false,
        counts: {
          total: totalCount,
          set: setCount,
          us: usCount,
          filtered: filtered.length,
        },
        timestamp: new Date().toISOString(),
        data: filtered,
      });
    }

    // Paginate in chunks of limit (default 50)
    const safePage = Math.max(1, isNaN(page) ? 1 : page);
    const safeLimit = Math.max(1, Math.min(200, isNaN(limit) ? 50 : limit));
    const offset = (safePage - 1) * safeLimit;
    const paginated = filtered.slice(offset, offset + safeLimit);
    const totalPages = Math.ceil(filtered.length / safeLimit);
    const hasMore = safePage < totalPages;

    return NextResponse.json({
      success: true,
      page: safePage,
      limit: safeLimit,
      total: filtered.length,
      totalPages,
      hasMore,
      counts: {
        total: totalCount,
        set: setCount,
        us: usCount,
        filtered: filtered.length,
      },
      timestamp: new Date().toISOString(),
      data: paginated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live stocks',
      },
      { status: 500 }
    );
  }
}
