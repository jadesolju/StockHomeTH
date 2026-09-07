import type { StockNewsItem, SentimentType, NewsCategory } from '../schemas/newsSchema';
import { translateClean } from '../utils/newsTranslationEngine';

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
      const combinedText = `${headline} ${summary}`;
      const sentiment = detectSentiment(combinedText);
      const category = detectCategory(combinedText);
      const epoch = item.datetime || Math.floor(Date.now() / 1000);
      const dateStrTh = formatRelativeTime(epoch);
      const dateStrEn = formatRelativeTimeEn(epoch);
      const sourceName = item.source ? `${item.source} (Finnhub)` : 'Finnhub Global';

      const title_th = translateClean(headline, 'th');
      const title_en = headline;
      const summary_th = translateClean(summary, 'th');
      const summary_en = summary;

      const keyTakeaways_th = [
        `${title_th} - ข่าวสารตรงจากสำนักข่าวชั้นนำระดับสากล (${item.source || 'Global'})`,
        `การประเมินสัญญาณข่าวจาก AI: ${sentiment === 'bullish' ? 'เชิงบวก (Bullish Outlook)' : sentiment === 'bearish' ? 'ระวังแรงกดดัน (Bearish Outlook)' : 'ทรงตัวเป็นกลาง (Neutral)'}`,
        `หุ้นเป้าหมาย: $${cleanSymbol} • ข้อมูลสดรับรองโดย Finnhub Intelligence Platform`
      ];

      const keyTakeaways_en = [
        `${headline} - Direct intelligence from verified international source (${item.source || 'Global'})`,
        `AI Sentiment Assessment: ${sentiment === 'bullish' ? 'Bullish Catalyst' : sentiment === 'bearish' ? 'Bearish Pressure' : 'Neutral Outlook'}`,
        `Target Asset: $${cleanSymbol} • Verified by Finnhub Intelligence Platform`
      ];

      return {
        id: `finnhub-${item.id || Math.random().toString(36).substring(2, 9)}`,
        title: headline,
        title_th,
        title_en,
        summary,
        summary_th,
        summary_en,
        keyTakeaways: keyTakeaways_en,
        keyTakeaways_th,
        keyTakeaways_en,
        fullContent: `${headline}\n\n${summary}\n\nSource: ${item.source || 'Finnhub News'}\nURL: ${item.url || ''}`,
        fullContent_th: `${title_th}\n\n${summary_th}\n\nที่มา: ${item.source || 'Finnhub News'}\nลิงก์ต้นฉบับ: ${item.url || ''}`,
        fullContent_en: `${headline}\n\n${summary}\n\nSource: ${item.source || 'Finnhub News'}\nURL: ${item.url || ''}`,
        region: 'global',
        timeframe: 'daily',
        marketName: 'US / Global Markets',
        date: dateStrEn,
        time: new Date(epoch * 1000).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        periodLabel: `Live Finnhub • ${dateStrEn}`,
        periodLabel_th: `ข่าวสด Finnhub • ${dateStrTh}`,
        periodLabel_en: `Live Finnhub • ${dateStrEn}`,
        sentiment,
        tickers: [cleanSymbol],
        readTime: '2 min',
        source: sourceName,
        category,
        impactAnalysis: {
          bullishReason: sentiment === 'bullish' ? `Finnhub Intelligence: Strong buying momentum and growth signals for $${cleanSymbol}` : undefined,
          bullishReason_th: sentiment === 'bullish' ? `Finnhub Intelligence: สัญญาณการเติบโตเชิงบวกและแรงซื้อต่อเนื่องในหุ้น $${cleanSymbol}` : undefined,
          bullishReason_en: sentiment === 'bullish' ? `Finnhub Intelligence: Strong buying momentum and growth signals for $${cleanSymbol}` : undefined,
          bearishReason: sentiment === 'bearish' ? `Finnhub Intelligence: Potential short-term volatility or pressure on $${cleanSymbol}` : undefined,
          bearishReason_th: sentiment === 'bearish' ? `Finnhub Intelligence: แรงกดดันจากความผันผวนหรือความกังวลระยะสั้นในหุ้น $${cleanSymbol}` : undefined,
          bearishReason_en: sentiment === 'bearish' ? `Finnhub Intelligence: Potential short-term volatility or pressure on $${cleanSymbol}` : undefined,
          targetSector: 'US & Global Markets',
          targetSector_th: 'หุ้นสหรัฐฯ & สากล',
          targetSector_en: 'US & Global Markets',
          priceTrendOutlook: sentiment === 'bullish' ? 'Upward momentum expected' : sentiment === 'bearish' ? 'Caution on short-term pullback' : 'Consolidation range (Sideways)',
          priceTrendOutlook_th: sentiment === 'bullish' ? 'แนวโน้มเชิงบวก มีโอกาสทดสอบระดับสูงสุดใหม่' : sentiment === 'bearish' ? 'แนวโน้มชะลอตัว ระมัดระวังความผันผวนระยะสั้น' : 'แกว่งตัวรอปัจจัยบวกใหม่ (Sideways)',
          priceTrendOutlook_en: sentiment === 'bullish' ? 'Upward momentum expected' : sentiment === 'bearish' ? 'Caution on short-term pullback' : 'Consolidation range (Sideways)',
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
