import type { StockNewsItem, SentimentType, NewsCategory } from '../schemas/newsSchema';
import { translateClean } from '../utils/newsTranslationEngine';
import { classifyNewsIntelligence } from '../utils/newsClassifier';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';

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

function formatRelativeTimeEn(epochSec: number): string {
  try {
    const diffMs = Date.now() - epochSec * 1000;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  } catch {
    return 'Today';
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
      const sourceName = item.source ? `${item.source} (Finnhub)` : 'Finnhub Global';

      // Run advanced multi-entity intelligence & ticker prioritizer
      const intelligence = classifyNewsIntelligence(headline, summary, 'global', sourceName);

      const epoch = item.datetime || Math.floor(Date.now() / 1000);
      const dateStrTh = formatRelativeTime(epoch);
      const dateStrEn = formatRelativeTimeEn(epoch);

      // Merge cleanSymbol into tickers if it was queried and not yet included
      const resolvedTickers = intelligence.tickers.length > 0 
        ? [...intelligence.tickers] 
        : [cleanSymbol];
      if (!resolvedTickers.includes(cleanSymbol) && `${headline} ${summary}`.toUpperCase().includes(cleanSymbol)) {
        resolvedTickers.push(cleanSymbol);
      }

      const tickerListLabel = resolvedTickers.map((t) => `$${t}`).join(', ');

      const keyTakeaways_th = [
        `${intelligence.title_th} - ข่าวสารตรงจากสำนักข่าวชั้นนำระดับสากล (${item.source || 'Global'})`,
        `การประเมินสัญญาณข่าวจาก AI: ${intelligence.sentiment === 'bullish' ? 'เชิงบวก (Bullish Outlook)' : intelligence.sentiment === 'bearish' ? 'ระวังแรงกดดัน (Bearish Outlook)' : 'ทรงตัวเป็นกลาง (Neutral)'}`,
        `หุ้นที่เกี่ยวข้อง: ${tickerListLabel} • ข้อมูลสดรับรองโดย Finnhub Intelligence Platform`
      ];

      const keyTakeaways_en = [
        `${intelligence.title_en} - Direct intelligence from verified international source (${item.source || 'Global'})`,
        `AI Sentiment Assessment: ${intelligence.sentiment === 'bullish' ? 'Bullish Catalyst' : intelligence.sentiment === 'bearish' ? 'Bearish Pressure' : 'Neutral Outlook'}`,
        `Related Equities: ${tickerListLabel} • Verified by Finnhub Intelligence Platform`
      ];

      return {
        id: `finnhub-${item.id || Math.random().toString(36).substring(2, 9)}`,
        title: intelligence.cleanTitle,
        title_th: intelligence.title_th,
        title_en: intelligence.title_en,
        summary: intelligence.cleanSummary,
        summary_th: intelligence.summary_th,
        summary_en: intelligence.summary_en,
        keyTakeaways: keyTakeaways_en,
        keyTakeaways_th,
        keyTakeaways_en,
        fullContent: `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nSource: ${item.source || 'Finnhub News'}\nURL: ${item.url || ''}`,
        fullContent_th: `${intelligence.title_th}\n\n${intelligence.summary_th}\n\nที่มา: ${item.source || 'Finnhub News'}\nลิงก์ต้นฉบับ: ${item.url || ''}`,
        fullContent_en: `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nSource: ${item.source || 'Finnhub News'}\nURL: ${item.url || ''}`,
        region: 'global',
        timeframe: 'daily',
        marketName: intelligence.marketName || 'US / Global Markets',
        date: dateStrEn,
        time: new Date(epoch * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        periodLabel: `Live Finnhub • ${dateStrEn}`,
        periodLabel_th: `ข่าวสด Finnhub • ${dateStrTh}`,
        periodLabel_en: `Live Finnhub • ${dateStrEn}`,
        sentiment: intelligence.sentiment,
        tickers: resolvedTickers,
        readTime: '2 min',
        source: sourceName,
        category: intelligence.category,
        impactAnalysis: intelligence.impactAnalysis,
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
      const formDescTh = formType === '10-K' ? 'รายงานประจำปี (Annual Report 10-K)'
        : formType === '10-Q' ? 'รายงานประจำไตรมาส (Quarterly Report 10-Q)'
        : formType === '8-K' ? 'รายงานเหตุการณ์สำคัญ (Current Report 8-K)'
        : formType === '4' ? 'รายงานการซื้อขายของผู้บริหาร (Insider Form 4)'
        : `แบบรายงาน ${formType} ต่อ ก.ล.ต. สหรัฐฯ (SEC EDGAR)`;

      const formDescEn = formType === '10-K' ? 'Annual Report (10-K)'
        : formType === '10-Q' ? 'Quarterly Report (10-Q)'
        : formType === '8-K' ? 'Current Report (8-K)'
        : formType === '4' ? 'Statement of Changes in Beneficial Ownership (Form 4)'
        : `SEC EDGAR Regulatory Filing (${formType})`;

      const filedDateStr = f.filedDate ? f.filedDate.split(' ')[0] : 'Latest';
      const title_th = `[SEC Filing] ${cleanSymbol} ยื่นแบบรายงาน ${formType} (${formDescTh})`;
      const title_en = `[SEC Filing] ${cleanSymbol} submitted ${formType} (${formDescEn})`;

      const summary_th = `บริษัท ${cleanSymbol} ได้ส่งมอบเอกสารแบบแสดงรายการข้อมูลทางการ (${formType}) ให้แก่สำนักงานคณะกรรมการกำกับหลักทรัพย์และตลาดหลักทรัพย์สหรัฐอเมริกา (SEC) เมื่อวันที่ ${filedDateStr}`;
      const summary_en = `${cleanSymbol} officially submitted regulatory filing (${formType}) to the U.S. Securities and Exchange Commission (SEC) on ${filedDateStr}`;

      const filingUrl = f.reportUrl || f.filingUrl || `https://www.sec.gov/edgar/searchedgar/companysearch`;

      return {
        id: `sec-filing-${f.accessNumber || Math.random().toString(36).substring(2, 9)}`,
        title: title_en,
        title_th,
        title_en,
        summary: summary_en,
        summary_th,
        summary_en,
        keyTakeaways: [
          `Regulatory Form Type: ${formType} (${formDescEn})`,
          `Filing Date: ${f.acceptedDate || f.filedDate || 'Latest'}`,
          `CIK: ${f.cik || 'N/A'} • Authenticated via U.S. SEC EDGAR Database`
        ],
        keyTakeaways_th: [
          `ประเภทเอกสารทางการ: ${formType} (${formDescTh})`,
          `วันที่บันทึกระบบ SEC: ${f.acceptedDate || f.filedDate || 'ล่าสุด'}`,
          `รหัส CIK: ${f.cik || 'N/A'} • เอกสารตรวจสอบสิทธิโดย SEC EDGAR Database`
        ],
        keyTakeaways_en: [
          `Regulatory Form Type: ${formType} (${formDescEn})`,
          `Filing Date: ${f.acceptedDate || f.filedDate || 'Latest'}`,
          `CIK: ${f.cik || 'N/A'} • Authenticated via U.S. SEC EDGAR Database`
        ],
        fullContent: `${title_en}\n\n${summary_en}\n\nAccession Number: ${f.accessNumber}\nCIK: ${f.cik}\nSEC Document: ${filingUrl}`,
        fullContent_th: `${title_th}\n\n${summary_th}\n\nAccession Number: ${f.accessNumber}\nCIK: ${f.cik}\nลิงก์ดูเอกสารทางการ: ${filingUrl}`,
        fullContent_en: `${title_en}\n\n${summary_en}\n\nAccession Number: ${f.accessNumber}\nCIK: ${f.cik}\nSEC Document: ${filingUrl}`,
        region: 'global',
        timeframe: 'daily',
        marketName: 'US SEC EDGAR',
        date: filedDateStr,
        time: 'Official Disclosure',
        periodLabel: `SEC Filing • ${filedDateStr}`,
        periodLabel_th: `แบบรายงาน SEC • ${filedDateStr}`,
        periodLabel_en: `SEC Filing • ${filedDateStr}`,
        sentiment: 'neutral' as SentimentType,
        tickers: [cleanSymbol],
        readTime: '1 min',
        source: 'U.S. SEC EDGAR (Finnhub Filings)',
        category: 'finance' as NewsCategory,
        impactAnalysis: {
          targetSector: 'US Official Disclosures',
          targetSector_th: 'เอกสารทางการ & งบการเงินสหรัฐฯ',
          targetSector_en: 'US Official Disclosures',
          priceTrendOutlook: 'Complies with SEC statutory disclosures',
          priceTrendOutlook_th: 'รายงานตามเกณฑ์ข้อบังคับ ก.ล.ต. สหรัฐฯ',
          priceTrendOutlook_en: 'Complies with SEC statutory disclosures'
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

// Cache for general market news (90-second TTL)
let marketNewsCache: StockNewsItem[] | null = null;
let marketNewsCacheTime = 0;
const MARKET_NEWS_TTL_MS = 90_000;

/**
 * Fetch Finnhub general market news (category=general)
 * Used as a priority-1 source in the live aggregator feed.
 * Returns [] silently if FINNHUB_API_KEY is not configured.
 */
export async function fetchFinnhubMarketNews(): Promise<StockNewsItem[]> {
  if (!FINNHUB_API_KEY) return []; // Key not configured – skip silently

  if (marketNewsCache && Date.now() - marketNewsCacheTime < MARKET_NEWS_TTL_MS) {
    return marketNewsCache;
  }

  try {
    const url = `https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_API_KEY}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) throw new Error(`Finnhub /news HTTP ${resp.status}`);

    const raw: Array<{
      id: number;
      headline: string;
      summary: string;
      source: string;
      url: string;
      datetime: number;
      related?: string;
      category?: string;
    }> = await resp.json();

    const items: StockNewsItem[] = raw.slice(0, 20).map((item) => {
      const title = item.headline || 'Finnhub Market News';
      const snippet = item.summary || title;
      const relTimeTh = formatRelativeTime(item.datetime);
      const relTimeEn = formatRelativeTimeEn(item.datetime);
      const sentiment = detectSentiment(title + ' ' + snippet);
      const category = detectCategory(title + ' ' + snippet);
      const tickers = item.related ? item.related.split(',').map(s => s.trim()).filter(Boolean) : [];

      return {
        id: `finnhub-market-${item.id}`,
        title,
        title_th: title,
        title_en: title,
        summary: snippet,
        summary_th: snippet,
        summary_en: snippet,
        keyTakeaways: [snippet],
        keyTakeaways_th: [snippet],
        keyTakeaways_en: [snippet],
        fullContent: `${title}\n\n${snippet}\n\nSource: ${item.source} via Finnhub`,
        fullContent_th: `${title}\n\n${snippet}\n\nรายงานโดย ${item.source} ผ่าน Finnhub`,
        fullContent_en: `${title}\n\n${snippet}\n\nSource: ${item.source} via Finnhub`,
        region: 'global' as const,
        timeframe: 'daily' as const,
        marketName: 'Global Markets',
        date: relTimeTh,
        time: new Date(item.datetime * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        periodLabel: `Live • ${relTimeEn}`,
        periodLabel_th: `ข่าวสด • ${relTimeTh}`,
        periodLabel_en: `Live • ${relTimeEn}`,
        sentiment,
        tickers,
        readTime: '2 min',
        source: item.source || 'Finnhub',
        category,
        relevanceScore: 80, // High baseline – Finnhub curated financial news
        impactAnalysis: {
          targetSector: 'Global Markets',
          targetSector_th: 'ตลาดโลก',
          targetSector_en: 'Global Markets',
          priceTrendOutlook: 'See article',
          priceTrendOutlook_th: 'ดูรายละเอียดในบทความ',
          priceTrendOutlook_en: 'See article for details'
        },
        isFeatured: false,
        isBookmarked: false,
        link: item.url || 'https://finnhub.io',
        url: item.url || 'https://finnhub.io',
        sourceUrl: item.url || 'https://finnhub.io'
      };
    });

    marketNewsCache = items;
    marketNewsCacheTime = Date.now();
    return items;
  } catch (err) {
    console.warn('[Finnhub Market News] Fetch failed:', err);
    return [];
  }
}
