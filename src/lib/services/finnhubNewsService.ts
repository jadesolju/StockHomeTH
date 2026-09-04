import type { StockNewsItem, SentimentType, NewsCategory } from '../schemas/newsSchema';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'dadd9d9r01qtj63otibgdadd9d9r01qtj63otic0';

// In-memory cache per symbol with 60-second TTL
interface FinnhubCacheEntry {
  timestamp: number;
  data: StockNewsItem[];
}
const finnhubNewsCache = new Map<string, FinnhubCacheEntry>();
const finnhubFilingsCache = new Map<string, FinnhubCacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute

function detectSentiment(text: string): SentimentType {
  const lower = text.toLowerCase();
  const bullish = ['surges', 'jump', 'gain', 'profit', 'boost', 'rally', 'growth', 'record', 'high', 'beat', 'bullish', 'upgrade', 'soar', 'outperform', 'rises', 'buy'];
  const bearish = ['plunges', 'drop', 'fall', 'loss', 'warning', 'decline', 'fears', 'cut', 'slump', 'bearish', 'downgrade', 'misses', 'tumbles', 'sell', 'lawsuit', 'probe'];

  const bCount = bullish.filter(w => lower.includes(w)).length;
  const beCount = bearish.filter(w => lower.includes(w)).length;

  if (bCount > beCount) return 'bullish';
  if (beCount > bCount) return 'bearish';
  return 'neutral';
}

function detectCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();
  if (lower.includes('chip') || lower.includes('ai') || lower.includes('tech') || lower.includes('cloud') || lower.includes('software') || lower.includes('semiconductor') || lower.includes('apple') || lower.includes('nvidia') || lower.includes('microsoft')) return 'tech';
  if (lower.includes('oil') || lower.includes('gas') || lower.includes('energy') || lower.includes('solar') || lower.includes('fuel') || lower.includes('opec')) return 'energy';
  if (lower.includes('bank') || lower.includes('fed') || lower.includes('rate') || lower.includes('inflation') || lower.includes('treasury') || lower.includes('loan')) return 'finance';
  if (lower.includes('retail') || lower.includes('consumer') || lower.includes('sales') || lower.includes('store') || lower.includes('walmart') || lower.includes('amazon')) return 'retail';
  if (lower.includes('health') || lower.includes('pharma') || lower.includes('drug') || lower.includes('fda') || lower.includes('biotech') || lower.includes('clinical')) return 'health';
  return 'macro';
}

function formatRelativeTime(epochSec: number): string {
  try {
    const diffMs = Date.now() - epochSec * 1000;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  } catch {
    return 'วันนี้';
  }
}

/**
 * Fetch company-specific news from Finnhub API for US stocks
 */
export async function fetchFinnhubCompanyNews(symbol: string): Promise<StockNewsItem[]> {
  const cleanSymbol = symbol.replace(/[\$\^\.]/g, '').trim().toUpperCase();
  const cached = finnhubNewsCache.get(cleanSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const now = new Date();
    const toDate = now.toISOString().split('T')[0];
    const fromDateObj = new Date();
    fromDateObj.setDate(now.getDate() - 30);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    const url = `https://finnhub.io/api/v1/company-news?symbol=${cleanSymbol}&from=${fromDate}&to=${toDate}&token=${FINNHUB_API_KEY}`;
    
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.warn(`[Finnhub] Response not ok (${response.status}) for ${cleanSymbol}`);
      return [];
    }

    const rawList = await response.json();
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return [];
    }

    const items: StockNewsItem[] = rawList.slice(0, 15).map((item: any) => {
      const headline = item.headline || `Breaking news for ${cleanSymbol}`;
      const summary = item.summary || headline;
      const combinedText = `${headline} ${summary}`;
      const sentiment = detectSentiment(combinedText);
      const category = detectCategory(combinedText);
      const epoch = item.datetime || Math.floor(Date.now() / 1000);
      const dateStr = formatRelativeTime(epoch);
      const sourceName = item.source ? `${item.source} (Finnhub)` : 'Finnhub Global';

      const bullishReason = sentiment === 'bullish'
        ? `Finnhub Intelligence: สัญญาณการเติบโตเชิงบวกและแรงซื้อต่อเนื่องในหุ้น $${cleanSymbol}`
        : undefined;

      const bearishReason = sentiment === 'bearish'
        ? `Finnhub Intelligence: แรงกดดันจากความผันผวนหรือความกังวลระยะสั้นในหุ้น $${cleanSymbol}`
        : undefined;

      const priceTrendOutlook = sentiment === 'bullish'
        ? `แนวโน้มเชิงบวก มีโอกาสทดสอบระดับสูงสุดใหม่`
        : sentiment === 'bearish'
        ? `แนวโน้มชะลอตัว ระมัดระวังความผันผวนระยะสั้น`
        : `แกว่งตัวรอปัจจัยบวกใหม่ (Sideways)`;

      return {
        id: `finnhub-${item.id || Math.random().toString(36).substring(2, 9)}`,
        title: headline,
        summary: summary,
        keyTakeaways: [
          `${headline} - ข่าวสารตรงจากสำนักข่าวชั้นนำระดับสากล (${item.source || 'Global'})`,
          `การประเมินสัญญาณข่าวจาก AI: ${sentiment === 'bullish' ? 'เชิงบวก (Bullish Outlook)' : sentiment === 'bearish' ? 'ระวังแรงกดดัน (Bearish Outlook)' : 'ทรงตัวเป็นกลาง (Neutral)'}`,
          `หุ้นเป้าหมาย: $${cleanSymbol} • ข้อมูลสดรับรองโดย Finnhub Intelligence Platform`
        ],
        fullContent: `${headline}\n\n${summary}\n\nที่มา: ${item.source || 'Finnhub News'}\nลิงก์ต้นฉบับ: ${item.url || ''}`,
        region: 'global',
        timeframe: 'daily',
        marketName: 'US / Global Markets',
        date: dateStr,
        time: new Date(epoch * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        periodLabel: `ข่าวสด Finnhub • ${dateStr}`,
        sentiment,
        tickers: [cleanSymbol],
        readTime: '2 นาที',
        source: sourceName,
        category,
        impactAnalysis: {
          bullishReason,
          bearishReason,
          targetSector: 'หุ้นสหรัฐฯ & สากล',
          priceTrendOutlook
        },
        isFeatured: false,
        isBookmarked: false,
        link: item.url || `https://finance.yahoo.com/quote/${cleanSymbol}`,
        url: item.url || `https://finance.yahoo.com/quote/${cleanSymbol}`,
        sourceUrl: item.url || `https://finance.yahoo.com/quote/${cleanSymbol}`
      };
    });

    finnhubNewsCache.set(cleanSymbol, {
      timestamp: Date.now(),
      data: items
    });

    return items;
  } catch (err) {
    console.error(`[Finnhub] Error fetching news for ${cleanSymbol}:`, err);
    return [];
  }
}

/**
 * Fetch official SEC Regulatory Filings (10-K, 10-Q, 8-K, etc.) from Finnhub API for US stocks
 */
export async function fetchFinnhubFilings(symbol: string): Promise<StockNewsItem[]> {
  const cleanSymbol = symbol.replace(/[\$\^\.]/g, '').trim().toUpperCase();
  const cached = finnhubFilingsCache.get(cleanSymbol);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://finnhub.io/api/v1/stock/filings?symbol=${cleanSymbol}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      console.warn(`[Finnhub Filings] Response not ok (${response.status}) for ${cleanSymbol}`);
      return [];
    }

    const rawList = await response.json();
    if (!Array.isArray(rawList) || rawList.length === 0) {
      return [];
    }

    const items: StockNewsItem[] = rawList.slice(0, 10).map((f: any) => {
      const formType = f.form || 'SEC Filing';
      const formDesc = formType === '10-K' ? 'รายงานประจำปี (Annual Report 10-K)'
        : formType === '10-Q' ? 'รายงานประจำไตรมาส (Quarterly Report 10-Q)'
        : formType === '8-K' ? 'รายงานเหตุการณ์สำคัญ (Current Report 8-K)'
        : formType === '4' ? 'รายงานการซื้อขายของผู้บริหาร (Insider Form 4)'
        : `แบบรายงาน ${formType} ต่อ ก.ล.ต. สหรัฐฯ (SEC EDGAR)`;

      const filedDateStr = f.filedDate ? f.filedDate.split(' ')[0] : 'ล่าสุด';
      const title = `[SEC Filing] ${cleanSymbol} ยื่นแบบรายงาน ${formType} (${formDesc})`;
      const summary = `บริษัท ${cleanSymbol} ได้ส่งมอบเอกสารแบบแสดงรายการข้อมูลทางการ (${formType}) ให้แก่สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์สหรัฐอเมริกา (SEC) เมื่อวันที่ ${filedDateStr}`;
      const filingUrl = f.reportUrl || f.filingUrl || `https://www.sec.gov/edgar/searchedgar/companysearch`;

      return {
        id: `sec-filing-${f.accessNumber || Math.random().toString(36).substring(2, 9)}`,
        title,
        summary,
        keyTakeaways: [
          `ประเภทเอกสารทางการ: ${formType} (${formDesc})`,
          `วันที่บันทึกระบบ SEC: ${f.acceptedDate || f.filedDate || 'ล่าสุด'}`,
          `รหัส CIK: ${f.cik || 'N/A'} • เอกสารตรวจสอบสิทธิโดย SEC EDGAR Database`
        ],
        fullContent: `${title}\n\n${summary}\n\nAccession Number: ${f.accessNumber}\nCIK: ${f.cik}\nลิงก์ดูเอกสารทางการ: ${filingUrl}`,
        region: 'global',
        timeframe: 'daily',
        marketName: 'US SEC EDGAR',
        date: filedDateStr,
        time: 'สารสนเทศทางการ',
        periodLabel: `SEC Filing • ${filedDateStr}`,
        sentiment: 'neutral' as SentimentType,
        tickers: [cleanSymbol],
        readTime: '1 นาที',
        source: 'U.S. SEC EDGAR (Finnhub Filings)',
        category: 'finance' as NewsCategory,
        impactAnalysis: {
          targetSector: 'เอกสารทางการ & งบการเงินสหรัฐฯ',
          priceTrendOutlook: 'รายงานตามเกณฑ์ข้อบังคับ ก.ล.ต. สหรัฐฯ'
        },
        isFeatured: false,
        isBookmarked: false,
        link: filingUrl,
        url: filingUrl,
        sourceUrl: filingUrl
      };
    });

    finnhubFilingsCache.set(cleanSymbol, { timestamp: Date.now(), data: items });
    return items;
  } catch (err) {
    console.error(`[Finnhub Filings] Error for ${cleanSymbol}:`, err);
    return [];
  }
}
