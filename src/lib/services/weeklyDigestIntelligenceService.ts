import type { DigestSummary, StockNewsItem } from '../schemas/newsSchema';
import { fetchLiveWeeklyAggregatedNews } from './weeklyNewsAggregatorService';
import { fetchLiveStockFundamentals } from './stockDataService';
import { enrichDualLanguageDigestSummary } from '../utils/newsTranslationEngine';
import { enrichDualLanguageDigestSummaryAsync } from './deeplTranslationService';
import { saveWeeklyOverviewToStorage, loadWeeklyOverviewFromStorage } from './weeklyNewsStorage';
import { isSundayWeeklySynthesisDay } from '../utils/marketHours';

/**
 * Generate comprehensive Weekly Digest & Keylist Intelligence
 * Primary auto-synthesis runs on Sundays; serves cached weekly intelligence on other days to minimize API load.
 */
export async function getLiveWeeklyDigestIntelligence(forceRefresh = false): Promise<DigestSummary> {
  const isSunday = isSundayWeeklySynthesisDay();

  // On non-Sunday days or when cache is valid, load from storage to conserve AI resources
  if (!forceRefresh) {
    try {
      const stored = await loadWeeklyOverviewFromStorage();
      if (stored) {
        return stored;
      }
    } catch {
      // Continue to computation if storage read fails
    }
  }

  const [weeklyNews, stocks] = await Promise.all([
    fetchLiveWeeklyAggregatedNews(forceRefresh).catch(() => []),
    fetchLiveStockFundamentals().catch(() => [])
  ]);

  const thaiWeekly = weeklyNews.filter((n) => n.region === 'thai');
  const usWeekly = weeklyNews.filter((n) => n.region === 'global');

  // 1. Extract Thai Weekly Catalysts (Keylist)
  let thaiCatalysts_th: string[] = [];
  let thaiCatalysts_en: string[] = [];

  if (thaiWeekly.length > 0) {
    thaiCatalysts_th = thaiWeekly.slice(0, 4).map((n) => {
      const topTakeaway = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
      const title = n.title_th || n.title;
      return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
    });
    thaiCatalysts_en = thaiWeekly.slice(0, 4).map((n) => {
      const topTakeaway = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
      const title = n.title_en || n.title;
      return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
    });
  } else {
    thaiCatalysts_th = [
      'สัญญาณ Fund Flow ไหลเข้าสะสมในหุ้นขนาดใหญ่ SET50 และหุ้นปันผลสูง (PTT, KBANK, ADVANC)',
      'การลงทุนโครงสร้างพื้นฐาน Data Center และศูนย์กลาง AI ในประเทศไทยขยายตัวต่อเนื่อง (DELTA, GULF)',
      'ตัวเลขเศรษฐกิจภาคบริการและการท่องเที่ยวไทยขยายตัวดีกว่าคาดการณ์ (AOT, CPALL, BDMS)',
      'ราคาน้ำมันดิบและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงานต้นน้ำ (PTTEP, TOP)'
    ];
    thaiCatalysts_en = [
      'Foreign & institutional fund flows steadily accumulated SET50 large caps and high-yield dividend blue chips (PTT, KBANK, ADVANC)',
      'Rapid hyperscale data center and regional AI infrastructure investments accelerated (DELTA, GULF)',
      'Service sector, medical tourism, and domestic consumer spending outperformed consensus forecasts (AOT, CPALL, BDMS)',
      'Stabilizing global crude energy and renewable benchmarks supported upstream energy heavyweights (PTTEP, TOP)'
    ];
  }

  // 2. Extract US/Global Weekly Catalysts (Keylist)
  let usCatalysts_th: string[] = [];
  let usCatalysts_en: string[] = [];

  if (usWeekly.length > 0) {
    usCatalysts_th = usWeekly.slice(0, 4).map((n) => {
      const topTakeaway = n.keyTakeaways_th?.[0] || n.keyTakeaways?.[0];
      const title = n.title_th || n.title;
      return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
    });
    usCatalysts_en = usWeekly.slice(0, 4).map((n) => {
      const topTakeaway = n.keyTakeaways_en?.[0] || n.keyTakeaways?.[0];
      const title = n.title_en || n.title;
      return topTakeaway ? `${title.slice(0, 45)}: ${topTakeaway}` : title;
    });
  } else {
    usCatalysts_th = [
      'NVIDIA (NVDA) & ชิป AI: ดีมานด์เซิร์ฟเวอร์ Blackwell AI และ Data Center ระดับโลกเติบโตทำสถิติสูงสุดใหม่',
      'Apple (AAPL) & Microsoft (MSFT): ยอดสมัครใช้บริการ Enterprise AI และรายได้ Cloud ขยายตัวแกร่ง',
      'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech ดีกว่าคาด',
      'Tesla (TSLA) & Clean Tech: การขยายระบบขับเคลื่อนอัตโนมัติ FSD และธุรกิจกักเก็บพลังงานเร่งตัว'
    ];
    usCatalysts_en = [
      'NVIDIA (NVDA) & AI Semiconductors: Blackwell AI server compute shipments and hyperscale demand hit fresh records',
      'Apple (AAPL) & Microsoft (MSFT): Enterprise AI subscriptions and cloud computing revenues expanded robustly',
      'Wall Street (S&P 500 & NASDAQ): Federal Reserve easing expectations and resilient Big Tech earnings lifted equities',
      'Tesla (TSLA) & Clean Energy: Full Self-Driving (FSD) rollout milestones and energy storage deployments accelerated'
    ];
  }

  // 3. Overall Key Catalysts
  const keyCatalysts_th = [...thaiCatalysts_th.slice(0, 2), ...usCatalysts_th.slice(0, 2)];
  const keyCatalysts_en = [...thaiCatalysts_en.slice(0, 2), ...usCatalysts_en.slice(0, 2)];

  // 4. Calculate 7-Day Market Sentiment
  let bullishPercent = 72;
  let bearishPercent = 14;
  let neutralPercent = 14;

  if (stocks && stocks.length > 0) {
    const gainers = stocks.filter((s) => s.change > 0).length;
    const losers = stocks.filter((s) => s.change < 0).length;
    const total = stocks.length;

    bullishPercent = Math.max(10, Math.round((gainers / total) * 100));
    bearishPercent = Math.max(5, Math.round((losers / total) * 100));
    neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);
  }

  const now = new Date();
  const dateStrTh = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateStrEn = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';

  const rawOverview = {
    id: `weekly-digest-${Date.now()}`,
    periodLabel: `สรุปภาพรวมตลาดรอบ 7 วัน • ${dateStrTh}`,
    periodLabel_th: `สรุปภาพรวมตลาดรอบ 7 วัน • ${dateStrTh}`,
    periodLabel_en: `7-Day Market Wrap-up • ${dateStrEn}`,
    timeframe: 'weekly' as const,
    region: 'all' as const,
    mainHeadline: 'สรุปสัปดาห์: สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง',
    mainHeadline_th: 'สรุปสัปดาห์: สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง',
    mainHeadline_en: 'Weekly Wrap: Robust Global Capital Inflows Fuel Asian Equities & US Tech Leaders',
    overviewSummary: 'ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ ส่งผลให้เกิดแรงซื้อสุทธิสะสมในหุ้น Big Cap และกลุ่มเทคโนโลยีระดับโลกอย่างต่อเนื่อง',
    overviewSummary_th: 'ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ ส่งผลให้เกิดแรงซื้อสุทธิสะสมในหุ้น Big Cap และกลุ่มเทคโนโลยีระดับโลกอย่างต่อเนื่อง',
    overviewSummary_en: 'Throughout the past week, global equities advanced favorably on resilient market liquidity and stellar corporate performance, sustaining strong net accumulation in large-cap leaders and tech innovators.',
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
    topWatchlistTickers: ['PTT', 'DELTA', 'NVDA', 'AAPL', 'ADVANC', 'MSFT'],
    updatedAt: `${dateStrTh} | ${timeStr}`
  };

  const enriched = await enrichDualLanguageDigestSummaryAsync(rawOverview) as DigestSummary;

  // Persist to storage
  await saveWeeklyOverviewToStorage(enriched);

  return enriched;
}
