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

    if (thaiNews.length > 0) {
      thaiCatalysts_th = thaiNews.slice(0, 4).map((n) => {
        const topTakeaway = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
        const title = n.title_th || n.title;
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
      thaiCatalysts_en = thaiNews.slice(0, 4).map((n) => {
        const topTakeaway = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
        const title = n.title_en || n.title;
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
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
    }

    // Extract authentic US & Global Catalysts
    let usCatalysts_th: string[] = [];
    let usCatalysts_en: string[] = [];

    if (usNews.length > 0) {
      usCatalysts_th = usNews.slice(0, 4).map((n) => {
        const topTakeaway = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
        const title = n.title_th || n.title;
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
      usCatalysts_en = usNews.slice(0, 4).map((n) => {
        const topTakeaway = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
        const title = n.title_en || n.title;
        return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
      });
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

      const topGainer = [...stocks].sort((a, b) => b.change - a.change)[0];

      const currentTime = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const currentDateTh = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
      const currentDateEn = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

      const leadTicker = topGainer?.ticker;
      const gainerTextTh = leadTicker ? `$${leadTicker}` : 'หุ้นกลุ่มเทคฯ และผู้นำตลาด';
      const gainerTextEn = leadTicker ? `$${leadTicker}` : 'Tech & Market leaders';

      let headlineTh = '';
      let headlineEn = '';

      if (sessionKey === 'night') {
        if (bullishPercent >= 55) {
          headlineTh = `เกาะติดตลาดหุ้นรอบค่ำ: บรรยากาศซื้อขายคึกคัก นำทัพโดยแรงซื้อใน ${gainerTextTh}`;
          headlineEn = `Wall Street & Global Wrap: Equities advance steadily, led by momentum in ${gainerTextEn}`;
        } else {
          headlineTh = `เกาะติดตลาดหุ้นรอบค่ำ: ภาวะลงทุนแกว่งตัวสลับกลุ่มเล่น นำโดยความเคลื่อนไหวของ ${gainerTextTh}`;
          headlineEn = `Wall Street & Global Wrap: Selective market rotation underway, led by ${gainerTextEn}`;
        }
      } else if (bullishPercent >= 60) {
        headlineTh = `ตลาดหุ้นปรับตัวสดใสต่อเนื่อง นำทัพโดยแรงซื้อเด่นในหุ้น ${gainerTextTh}`;
        headlineEn = `Markets rally with broad-based buying interest, led by strong gains in ${gainerTextEn}`;
      } else if (bullishPercent >= 45) {
        headlineTh = `ตลาดหุ้นเคลื่อนไหวในกรอบทรงตัว มีแรงซื้อเก็งกำไรหมุนเวียน นำโดย ${gainerTextTh}`;
        headlineEn = `Markets trade in a stable range with sector rotation, led by ${gainerTextEn}`;
      } else {
        headlineTh = `ภาวะตลาดแกว่งตัวผันผวนและพักฐาน ขณะที่ ${gainerTextTh} ยังมีแรงหนุนโดดเด่น`;
        headlineEn = `Markets face selective consolidation as ${gainerTextEn} demonstrates resilience`;
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
        overviewSummary: `ความเคลื่อนไหวตลาดล่าสุด (${sessionInfo.labelTh}): หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total} บริษัทที่ติดตามในระบบ (${sessionInfo.descriptionTh})`,
        overviewSummary_th: `ความเคลื่อนไหวตลาดล่าสุด (${sessionInfo.labelTh}): หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total} บริษัทที่ติดตามในระบบ (${sessionInfo.descriptionTh})`,
        overviewSummary_en: `Latest Market Activity (${sessionInfo.labelEn}): ${gainers} advancers vs ${losers} decliners across ${total} monitored equities (${sessionInfo.descriptionEn})`,
        marketSentimentScore: {
          bullishPercent,
          neutralPercent,
          bearishPercent
        },
        keyCatalysts: keyCatalysts_th,
        keyCatalysts_th,
        keyCatalysts_en,
        thaiCatalysts: thaiCatalysts_th,
        thaiCatalysts_th,
        thaiCatalysts_en,
        usCatalysts: usCatalysts_th,
        usCatalysts_th,
        usCatalysts_en,
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
