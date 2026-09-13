import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { fetchLiveStockFundamentals } from '../../../../lib/services/stockDataService';
import { fetchLiveAggregatedNews } from '../../../../lib/services/liveNewsAggregatorService';
import { getLiveWeeklyDigestIntelligence } from '../../../../lib/services/weeklyDigestIntelligenceService';
import { enrichDualLanguageDigestSummary } from '../../../../lib/utils/newsTranslationEngine';
import { enrichDualLanguageDigestSummaryAsync } from '../../../../lib/services/deeplTranslationService';
import { getCurrentBriefingSession } from '../../../../lib/utils/marketHours';
import { mockDailyDigestSummary } from '../../../../data/mockNewsData';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SESSION_CACHE_FILE = path.resolve(process.cwd(), 'market_briefing_session_cache.json');

function loadSessionCache(): Record<string, any> | null {
  try {
    if (fs.existsSync(SESSION_CACHE_FILE)) {
      const raw = fs.readFileSync(SESSION_CACHE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

function saveSessionCache(key: string, data: any) {
  try {
    const existing = loadSessionCache() || {};
    existing[key] = {
      timestamp: new Date().toISOString(),
      data
    };
    fs.writeFileSync(SESSION_CACHE_FILE, JSON.stringify(existing, null, 2), 'utf-8');
  } catch {}
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || 'daily';
    const forceRefresh = searchParams.get('refresh') === 'true' || searchParams.get('force') === 'true';

    // 1. If Weekly overview requested
    if (timeframe === 'weekly') {
      const weeklyOverview = await getLiveWeeklyDigestIntelligence(forceRefresh);
      return NextResponse.json({
        success: true,
        source: 'live_weekly_intelligence',
        timeframe: 'weekly',
        data: weeklyOverview
      });
    }

    // 2. Daily Overview with 4-Session Checkpoints (สาย เที่ยง เย็น ค่ำ)
    const now = new Date();
    const sessionInfo = getCurrentBriefingSession(now);
    const dateKey = now.toISOString().split('T')[0];
    const sessionKey = `${dateKey}-${sessionInfo.sessionKey}`;

    // Return cached briefing for current session if available and not forced
    if (!forceRefresh) {
      const cacheMap = loadSessionCache();
      if (cacheMap && cacheMap[sessionKey]?.data) {
        return NextResponse.json({
          success: true,
          source: 'session_checkpoint_cache',
          session: sessionInfo,
          cachedAt: cacheMap[sessionKey].timestamp,
          data: cacheMap[sessionKey].data
        });
      }
    }

    const [stocks, liveNews] = await Promise.all([
      fetchLiveStockFundamentals().catch(() => []),
      fetchLiveAggregatedNews().catch(() => [])
    ]);

    const thaiNews = (liveNews || []).filter((n) => n.region === 'thai');
    const usNews = (liveNews || []).filter((n) => n.region === 'global');

    // Extract authentic Thai Catalysts
    let thaiCatalysts_th: string[] = [];
    let thaiCatalysts_en: string[] = [];
    let thaiCatalystsItems: { text: string; text_th?: string; text_en?: string; newsId?: string }[] = [];

    if (thaiNews.length > 0) {
      thaiCatalystsItems = thaiNews.slice(0, 4).map((n) => {
        const topTakeawayTh = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
        const titleTh = n.title_th || n.title;
        const textTh = topTakeawayTh ? `${titleTh.slice(0, 45)}: ${topTakeawayTh}` : titleTh;

        const topTakeawayEn = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
        const titleEn = n.title_en || n.title;
        const textEn = topTakeawayEn ? `${titleEn.slice(0, 45)}: ${topTakeawayEn}` : titleEn;

        return {
          text: textTh,
          text_th: textTh,
          text_en: textEn,
          newsId: n.id
        };
      });
      thaiCatalysts_th = thaiCatalystsItems.map((c) => c.text_th!);
      thaiCatalysts_en = thaiCatalystsItems.map((c) => c.text_en!);
    } else {
      thaiCatalysts_th = [
        'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
        'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, HANA, KCE)',
        'กำลังซื้อในประเทศและการฟื้นตัวของภาคท่องเที่ยวหนุนกลุ่มพาณิชย์ (CPALL, BDMS, AOT)',
        'เม็ดเงินลงทุนสถาบันและ Fund Flow เข้าซื้อสะสมในกลุ่มหุ้น Big Cap SET50'
      ];
      thaiCatalysts_en = [
        'Global crude oil & renewable energy stability supported key energy giants (PTT, GULF, PTTEP)',
        'Electronics export growth and AI server component shipments expanded (DELTA, HANA, KCE)',
        'Domestic consumer spending and medical tourism recovery boosted retail heavyweights (CPALL, BDMS, AOT)',
        'Institutional capital and foreign inflows accumulated core SET50 constituents'
      ];
      thaiCatalystsItems = thaiCatalysts_th.map((t, idx) => ({ text: t, text_th: t, text_en: thaiCatalysts_en[idx] }));
    }

    // Extract authentic US & Global Catalysts
    let usCatalysts_th: string[] = [];
    let usCatalysts_en: string[] = [];
    let usCatalystsItems: { text: string; text_th?: string; text_en?: string; newsId?: string }[] = [];

    if (usNews.length > 0) {
      usCatalystsItems = usNews.slice(0, 4).map((n) => {
        const topTakeawayTh = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
        const titleTh = n.title_th || n.title;
        const textTh = topTakeawayTh ? `${titleTh.slice(0, 45)}: ${topTakeawayTh}` : titleTh;

        const topTakeawayEn = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
        const titleEn = n.title_en || n.title;
        const textEn = topTakeawayEn ? `${titleEn.slice(0, 45)}: ${topTakeawayEn}` : titleEn;

        return {
          text: textTh,
          text_th: textTh,
          text_en: textEn,
          newsId: n.id
        };
      });
      usCatalysts_th = usCatalystsItems.map((c) => c.text_th!);
      usCatalysts_en = usCatalystsItems.map((c) => c.text_en!);
    } else {
      usCatalysts_th = [
        'NVIDIA (NVDA): ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง',
        'Apple (AAPL) & Microsoft (MSFT): ยอดสมาชิกและบริการ Cloud AI สหรัฐฯ ขยายตัวแข็งแกร่ง',
        'Tesla (TSLA): ความคืบหน้าการพัฒนาซอฟต์แวร์ Autonomous Driving และยอดส่งมอบรถ EV ทั่วโลก',
        'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech สหรัฐฯ'
      ];
      usCatalysts_en = [
        'NVIDIA (NVDA): Blackwell AI server compute shipments and hyperscale datacenter demand surged',
        'Apple (AAPL) & Microsoft (MSFT): Enterprise cloud subscription expansions and AI service adoption grew strongly',
        'Tesla (TSLA): Autonomous driving technology rollout milestones and global EV delivery momentum accelerated',
        'Wall Street (S&P 500 & NASDAQ): Federal Reserve policy expectations and resilient Big Tech earnings supported indices'
      ];
      usCatalystsItems = usCatalysts_th.map((t, idx) => ({ text: t, text_th: t, text_en: usCatalysts_en[idx] }));
    }

    // Overall top catalysts
    const keyCatalysts_th: string[] = [
      ...usCatalysts_th.slice(0, 2),
      ...thaiCatalysts_th.slice(0, 2)
    ];
    const keyCatalysts_en: string[] = [
      ...usCatalysts_en.slice(0, 2),
      ...thaiCatalysts_en.slice(0, 2)
    ];

    if (stocks && stocks.length > 0) {
      const gainers = stocks.filter((s) => s.change > 0).length;
      const losers = stocks.filter((s) => s.change < 0).length;
      const total = stocks.length;

      const bullishPercent = Math.round((gainers / total) * 100);
      const bearishPercent = Math.round((losers / total) * 100);
      const neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);
      const currentTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const currentDateTh = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      const currentDateEn = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const thaiStocks = stocks.filter((s) => s.market === 'SET');
      const usStocks = stocks.filter((s) => s.market === 'US');

      const topThaiMovers = [...thaiStocks].sort((a, b) => b.change - a.change).slice(0, 3).map(s => `$${s.ticker}`);
      const topUsMovers = [...usStocks].sort((a, b) => b.change - a.change).slice(0, 3).map(s => `$${s.ticker}`);

      const leadTickersTh = sessionKey === 'night' 
        ? (topUsMovers.length > 0 ? topUsMovers.join(', ') : '$NVDA, $AAPL, $TSLA')
        : (topThaiMovers.length > 0 ? topThaiMovers.join(', ') : '$DELTA, $PTT, $GULF');

      const leadTickersEn = sessionKey === 'night'
        ? (topUsMovers.length > 0 ? topUsMovers.join(', ') : '$NVDA, $AAPL, $TSLA')
        : (topThaiMovers.length > 0 ? topThaiMovers.join(', ') : '$DELTA, $PTT, $GULF');

      let headlineTh = '';
      let headlineEn = '';

      if (sessionKey === 'night') {
        if (bullishPercent >= 55) {
          headlineTh = `เกาะติดตลาดรอบค่ำ & Wall Street: ตลาดสหรัฐฯ ปรับตัวสดใส — หุ้นโดดเด่นประจำวัน: ${leadTickersTh}`;
          headlineEn = `Wall Street & Global Wrap: Tech & Equities Rally — Market Leaders: ${leadTickersEn}`;
        } else {
          headlineTh = `เกาะติดตลาดรอบค่ำ & Wall Street: ดัชนีแกว่งตัวสลับกลุ่มเล่น — หุ้นโดดเด่นประจำวัน: ${leadTickersTh}`;
          headlineEn = `Wall Street & Global Wrap: Sector Rotation Underway — Market Leaders: ${leadTickersEn}`;
        }
      } else if (bullishPercent >= 60) {
        headlineTh = `สรุปภาวะตลาด: ดัชนีปรับตัวขึ้นอย่างแข็งแกร่ง — หุ้นโดดเด่นประจำวัน: ${leadTickersTh}`;
        headlineEn = `Market Intelligence: Broad-Based Equity Rally — Daily Leaders: ${leadTickersEn}`;
      } else if (bullishPercent >= 45) {
        headlineTh = `สรุปภาวะตลาด: ตลาดเคลื่อนไหวทรงตัวในกรอบ — หุ้นโดดเด่นประจำวัน: ${leadTickersTh}`;
        headlineEn = `Market Intelligence: Equities Consolidate Steadily — Daily Highlights: ${leadTickersEn}`;
      } else {
        headlineTh = `สรุปภาวะตลาด: ดัชนีพักฐานและเผชิญแรงขายทำกำไร — หุ้นโดดเด่นประจำวัน: ${leadTickersTh}`;
        headlineEn = `Market Intelligence: Market Pullback & Defensive Positioning — Key Movers: ${leadTickersEn}`;
      }

      const rawOverview = {
        id: `overview-${sessionKey}-${Date.now()}`,
        periodLabel: `${sessionInfo.labelTh} (${sessionInfo.timeRangeTh}) • ${currentDateTh}`,
        periodLabel_th: `${sessionInfo.labelTh} (${sessionInfo.timeRangeTh}) • ${currentDateTh}`,
        periodLabel_en: `${sessionInfo.labelEn} (${sessionInfo.timeRangeEn}) • ${currentDateEn}`,
        updatedAt: currentTime,
        timeframe: 'daily' as const,
        region: 'all' as const,
        mainHeadline: headlineTh,
        mainHeadline_th: headlineTh,
        mainHeadline_en: headlineEn,
        overviewSummary: `ความเคลื่อนไหวตลาดล่าสุด: หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total.toLocaleString()} บริษัทที่ติดตามในระบบ (${sessionInfo.descriptionTh})`,
        overviewSummary_th: `ความเคลื่อนไหวตลาดล่าสุด: หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total.toLocaleString()} บริษัทที่ติดตามในระบบ (${sessionInfo.descriptionTh})`,
        overviewSummary_en: `Latest Market Breadth: ${gainers} advancing stocks vs ${losers} declining stocks across ${total.toLocaleString()} monitored equities (${sessionInfo.descriptionEn})`,
        marketSentimentScore: {
          bullishPercent,
          neutralPercent,
          bearishPercent
        },
        keyCatalysts: keyCatalysts_th,
        keyCatalysts_th,
        keyCatalysts_en,
        thaiCatalysts: thaiCatalystsItems.length > 0 ? thaiCatalystsItems : thaiCatalysts_th,
        thaiCatalysts_th,
        thaiCatalysts_en,
        thaiCatalystsItems,
        usCatalysts: usCatalystsItems.length > 0 ? usCatalystsItems : usCatalysts_th,
        usCatalysts_th,
        usCatalysts_en,
        usCatalystsItems,
        topWatchlistTickers: ['PTT', 'DELTA', 'NVDA', 'AAPL', 'CPALL']
      };

      const enriched = await enrichDualLanguageDigestSummaryAsync(rawOverview);
      
      // Persist to session cache
      saveSessionCache(sessionKey, enriched);

      return NextResponse.json({
        success: true,
        source: 'live_computed_session',
        session: sessionInfo,
        data: enriched
      });
    }
  } catch (err) {
    console.warn('[Market Overview API] Live calculation error, falling back to mock:', err);
  }

  const enrichedMock = enrichDualLanguageDigestSummary(mockDailyDigestSummary);
  return NextResponse.json({ success: true, source: 'mock', data: enrichedMock });
}
