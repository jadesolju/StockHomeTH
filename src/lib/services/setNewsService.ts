import Parser from 'rss-parser';
import type { StockNewsItem, SentimentType, NewsCategory } from '../schemas/newsSchema';
import { cleanNewsTitle, cleanNewsSnippet } from '../utils/newsClassifier';

const SET_API_KEY = process.env.SET_MARKETPLACE_API_KEY || 'a0204fed-b7ff-4ed0-a908-d6b85334a07a';
const SET_API_URL = 'https://marketplace.set.or.th/api/public/news/IR';

const rssParser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
  },
  timeout: 8000
});

// Cache per ticker with 60s TTL
const setNewsCache = new Map<string, { timestamp: number; data: StockNewsItem[] }>();
const CACHE_TTL_MS = 60_000;

interface SetRawNewsItem {
  publishDate: string;
  newsId: string;
  newsGroup?: string;
  reportType?: string; // NWS, FIN, ANN, F56
  newsType?: string;   // 41 (SET News Release), 51 (Form 45), 61 (Investor Alert), etc.
  language?: string;   // T, E, B
  symbol?: string[];
  marketId?: string;   // SET, MAI, TFEX
  senderName?: string;
  headline: string;
  newsFileName?: string;
  pdfFileName?: string;
  period?: number;
  quarter?: number;
  dateAsOf?: string;
  finStmtType?: string;
  finStmtStatus?: string;
  templateCodes?: string[];
}

function detectThaiSentiment(text: string): SentimentType {
  const lower = text.toLowerCase();
  const bullish = ['พุ่ง', 'ทะยาน', 'โต', 'บวก', 'กำไร', 'หนุน', 'คึกคัก', 'เป้า', 'ฟื้น', 'ซื้อ', 'จ่ายปันผล', 'เติบโต', 'อนุมัติ', 'ชนะประมูล', 'surges', 'gain', 'profit', 'boost'];
  const bearish = ['ดิ่ง', 'ร่วง', 'ทรุด', 'ลบ', 'ขาดทุน', 'กังวล', 'เสี่ยง', 'กดดัน', 'ชะลอ', 'ขาย', 'เตือน', 'ชี้แจง', 'โดนเทขาย', 'plunges', 'drop', 'fall', 'loss'];

  const bCount = bullish.filter(w => lower.includes(w)).length;
  const beCount = bearish.filter(w => lower.includes(w)).length;

  if (bCount > beCount) return 'bullish';
  if (beCount > bCount) return 'bearish';
  return 'neutral';
}

function getReportTypeLabel(reportType?: string, newsType?: string): string {
  if (reportType === 'FIN') return 'รายงานงบการเงินและผลการดำเนินงาน';
  if (reportType === 'ANN') return 'รายงานประจำปี (Annual Report)';
  if (reportType === 'F56') return 'แบบแสดงรายการข้อมูลประจำปี (Form 56-1 One Report)';
  if (newsType === '61') return 'ข่าวแจ้งเตือนผู้ลงทุน (Investor Alert)';
  if (newsType === '51' || newsType === '52' || newsType === '53') return 'สรุปผลการดำเนินงาน (Form 45)';
  return 'ข่าวแจ้งตลาดหลักทรัพย์ฯ (SET Official)';
}

function formatThaiRelativeTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
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
 * Fetch official stock announcements from SET Marketplace IR API with live RSS fallback
 */
export async function fetchSetStockNews(ticker: string): Promise<StockNewsItem[]> {
  const cleanTicker = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
  const cached = setNewsCache.get(cleanTicker);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 1. Try Official SET Marketplace IR API
  try {
    const url = `${SET_API_URL}?stockSymbol=${cleanTicker}`;
    const response = await fetch(url, {
      headers: {
        'api-key': SET_API_KEY,
        'Accept': 'application/json',
        'User-Agent': 'StockHomeTH-SET-Client/2.0'
      },
      next: { revalidate: 60 }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.news) && data.news.length > 0) {
        const items: StockNewsItem[] = data.news.map((item: SetRawNewsItem) => {
          const headline = item.headline || `ข่าวแจ้งตลาดหลักทรัพย์ฯ ของ ${cleanTicker}`;
          const sentiment = detectThaiSentiment(headline);
          const typeLabel = getReportTypeLabel(item.reportType, item.newsType);
          const pubDate = item.publishDate || new Date().toISOString();
          const relativeTime = formatThaiRelativeTime(pubDate);

          // Direct link to SET news details or PDF
          let link = `https://www.set.or.th/th/market/news-and-alert/newsdetails?id=${item.newsId}&symbol=${cleanTicker}`;
          if (item.pdfFileName) {
            link = `https://weblink.set.or.th/dat/news/${item.pdfFileName}`;
          }

          const qLabel = item.quarter ? `ไตรมาส ${item.quarter === 6 ? 'ครึ่งปีแรก' : item.quarter}` : '';
          const summary = `${typeLabel}: ${headline} ${qLabel ? `(${qLabel} ปี ${item.period || ''})` : ''} ข้อมูลส่งตรงจากตลาดหลักทรัพย์แห่งประเทศไทย`;

          const title_th = headline;
          const title_en = `[SET Official Disclosure] ${cleanTicker}: ${headline}`;
          const summary_th = summary;
          const summary_en = `Stock Exchange of Thailand Official Disclosure: ${headline} (${cleanTicker}). Verified company filing.`;

          const keyTakeaways_th = [
            `${headline} - ข่าวแจ้งเป็นทางการผ่านระบบเปิดเผยสารสนเทศของตลาดหลักทรัพย์แห่งประเทศไทย (SET)`,
            `ประเภทรายงาน: ${typeLabel} • ผู้ส่งสารสนเทศ: ${item.senderName || cleanTicker}`,
            `การประเมินสัญญาณ: ${sentiment === 'bullish' ? 'เชิงบวกต่อผลการดำเนินงาน' : sentiment === 'bearish' ? 'ระวังแรงกดดันระยะสั้น' : 'รายงานตามรอบบัญชี/สารสนเทศทั่วไป'}`
          ];

          const keyTakeaways_en = [
            `Official regulatory filing for ${cleanTicker} disclosed through SET Information Portal`,
            `Report Type: ${typeLabel} • Reporting Entity: ${item.senderName || cleanTicker}`,
            `AI Sentiment Assessment: ${sentiment === 'bullish' ? 'Bullish' : sentiment === 'bearish' ? 'Bearish' : 'Neutral Disclosure'}`
          ];

          return {
            id: `set-ir-${item.newsId || Math.random().toString(36).substring(2, 9)}`,
            title: headline,
            title_th,
            title_en,
            summary,
            summary_th,
            summary_en,
            keyTakeaways: keyTakeaways_th,
            keyTakeaways_th,
            keyTakeaways_en,
            fullContent: `${headline}\n\n${summary}\n\nรหัสข่าว (News ID): ${item.newsId}\nผู้รายงาน: ${item.senderName || cleanTicker}\nเอกสารแนบ: ${item.pdfFileName || 'ไม่มี'}`,
            fullContent_th: `${headline}\n\n${summary}\n\nรหัสข่าว (News ID): ${item.newsId}\nผู้รายงาน: ${item.senderName || cleanTicker}\nเอกสารแนบ: ${item.pdfFileName || 'ไม่มี'}`,
            fullContent_en: `${title_en}\n\n${summary_en}\n\nNews ID: ${item.newsId}\nReporter: ${item.senderName || cleanTicker}`,
            region: 'thai',
            timeframe: 'daily',
            marketName: 'SET Index (ตลาดหลักทรัพย์ฯ)',
            date: relativeTime,
            time: new Date(pubDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            periodLabel: `ข่าวสด SET IR • ${relativeTime}`,
            periodLabel_th: `ข่าวสด SET IR • ${relativeTime}`,
            periodLabel_en: `Live SET IR • ${relativeTime}`,
            sentiment,
            tickers: item.symbol && item.symbol.length > 0 ? item.symbol : [cleanTicker],
            readTime: '1 นาที',
            source: 'ตลาดหลักทรัพย์แห่งประเทศไทย (SET IR API)',
            category: item.reportType === 'FIN' ? 'finance' : 'macro',
            impactAnalysis: {
              bullishReason: sentiment === 'bullish' ? 'สารสนเทศแสดงการเติบโตหรือปัจจัยบวกต่อผลประกอบการ' : undefined,
              bullishReason_th: sentiment === 'bullish' ? 'สารสนเทศแสดงการเติบโตหรือปัจจัยบวกต่อผลประกอบการ' : undefined,
              bullishReason_en: sentiment === 'bullish' ? 'Official disclosure reflects positive growth or operational earnings catalyst' : undefined,
              bearishReason: sentiment === 'bearish' ? 'สารสนเทศอาจสร้างความกังวลหรือความผันผวนต่อราคาหุ้น' : undefined,
              bearishReason_th: sentiment === 'bearish' ? 'สารสนเทศอาจสร้างความกังวลหรือความผันผวนต่อราคาหุ้น' : undefined,
              bearishReason_en: sentiment === 'bearish' ? 'Disclosure may induce short-term operational concerns or price volatility' : undefined,
              targetSector: 'หุ้นไทย (SET)',
              targetSector_th: 'หุ้นไทย (SET)',
              targetSector_en: 'Thai Equities (SET)',
              priceTrendOutlook: sentiment === 'bullish' ? 'หนุนความเชื่อมั่นนักลงทุน' : sentiment === 'bearish' ? 'ระมัดระวังแรงขาย' : 'ทรงตัวตามตลาด',
              priceTrendOutlook_th: sentiment === 'bullish' ? 'หนุนความเชื่อมั่นนักลงทุน' : sentiment === 'bearish' ? 'ระมัดระวังแรงขาย' : 'ทรงตัวตามตลาด',
              priceTrendOutlook_en: sentiment === 'bullish' ? 'Boosts investor confidence' : sentiment === 'bearish' ? 'Caution on selling pressure' : 'Market-neutral consolidation'
            },
            isFeatured: false,
            isBookmarked: false,
            link,
            url: link,
            sourceUrl: link
          };
        });

        setNewsCache.set(cleanTicker, { timestamp: Date.now(), data: items });
        return items;
      }
    }
  } catch (err) {
    console.warn(`[SET IR API] Error calling SET API for ${cleanTicker}, falling back to dedicated live RSS:`, err);
  }

  // 2. High-Precision Live RSS Fallback for individual Thai stock
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(`${cleanTicker} หุ้น OR SET OR ตลาดหลักทรัพย์`)}&hl=th&gl=TH&ceid=TH:th`;
    const feed = await rssParser.parseURL(rssUrl);

    if (feed && feed.items && feed.items.length > 0) {
      const items: StockNewsItem[] = feed.items.slice(0, 10).map((item, idx) => {
        const rawTitle = cleanNewsTitle(item.title || '');
        const snippet = cleanNewsSnippet(item.contentSnippet || item.title || '', rawTitle, true);
        const pubDate = item.pubDate || new Date().toISOString();
        const relativeTime = formatThaiRelativeTime(pubDate);
        const sentiment = detectThaiSentiment(`${rawTitle} ${snippet}`);
        const sourceName = item.source?.title || item.creator || 'ข่าวหุ้นและการเงินไทย';
        const itemLink = item.link || `https://www.settrade.com/th/equities/quote/${cleanTicker}/overview`;

        const title_th = rawTitle;
        const title_en = `[Thai Market News] ${cleanTicker}: ${rawTitle}`;
        const summary_th = snippet;
        const summary_en = `Market news and development for ${cleanTicker} reported by ${sourceName}.`;

        const keyTakeaways_th = [
          `${rawTitle} - สรุปข่าวสารสดและทิศทางธุรกิจของ $${cleanTicker}`,
          `การประเมินอารมณ์ตลาดจาก AI: ${sentiment === 'bullish' ? 'เชิงบวก (Bullish)' : sentiment === 'bearish' ? 'เชิงลบ (Bearish)' : 'เป็นกลาง/เก็งกำไรในกรอบ'}`,
          `แหล่งข่าวต้นฉบับ: ${sourceName}`
        ];

        const keyTakeaways_en = [
          `Live market update and business catalyst for ${cleanTicker}`,
          `AI Sentiment Evaluation: ${sentiment === 'bullish' ? 'Bullish' : sentiment === 'bearish' ? 'Bearish' : 'Neutral Consolidation'}`,
          `Source: ${sourceName}`
        ];

        return {
          id: `set-rss-${cleanTicker.toLowerCase()}-${idx}-${Math.abs(hashString(rawTitle))}`,
          title: rawTitle,
          title_th,
          title_en,
          summary: snippet,
          summary_th,
          summary_en,
          keyTakeaways: keyTakeaways_th,
          keyTakeaways_th,
          keyTakeaways_en,
          fullContent: `${rawTitle}\n\n${snippet}\n\nรายงานสดจาก ${sourceName} • ลิงก์ต้นฉบับ: ${itemLink}`,
          fullContent_th: `${rawTitle}\n\n${snippet}\n\nรายงานสดจาก ${sourceName} • ลิงก์ต้นฉบับ: ${itemLink}`,
          fullContent_en: `${title_en}\n\n${summary_en}\n\nReported by ${sourceName} • Original URL: ${itemLink}`,
          region: 'thai',
          timeframe: 'daily',
          marketName: 'SET Index (ไทย)',
          date: relativeTime,
          time: new Date(pubDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
          periodLabel: `ข่าวสด Real-Time • ${relativeTime}`,
          periodLabel_th: `ข่าวสด Real-Time • ${relativeTime}`,
          periodLabel_en: `Live Real-Time • ${relativeTime}`,
          sentiment,
          tickers: [cleanTicker],
          readTime: '2 นาที',
          source: `${sourceName} (Live Feed)`,
          category: 'macro',
          impactAnalysis: {
            bullishReason: sentiment === 'bullish' ? `แรงซื้อเก็งกำไรและความเชื่อมั่นในหุ้น $${cleanTicker}` : undefined,
            bullishReason_th: sentiment === 'bullish' ? `แรงซื้อเก็งกำไรและความเชื่อมั่นในหุ้น $${cleanTicker}` : undefined,
            bullishReason_en: sentiment === 'bullish' ? `Speculative buying and confidence tailwinds for $${cleanTicker}` : undefined,
            bearishReason: sentiment === 'bearish' ? `แรงกดดันระยะสั้นและความผันผวนในหุ้น $${cleanTicker}` : undefined,
            bearishReason_th: sentiment === 'bearish' ? `แรงกดดันระยะสั้นและความผันผวนในหุ้น $${cleanTicker}` : undefined,
            bearishReason_en: sentiment === 'bearish' ? `Short-term profit taking and market volatility in $${cleanTicker}` : undefined,
            targetSector: 'หุ้นไทย (SET)',
            targetSector_th: 'หุ้นไทย (SET)',
            targetSector_en: 'Thai Equities (SET)',
            priceTrendOutlook: sentiment === 'bullish' ? 'มีโอกาสทดสอบแนวต้าน' : sentiment === 'bearish' ? 'ระวังแรงขายทำกำไร' : 'แกว่งตัวในกรอบ',
            priceTrendOutlook_th: sentiment === 'bullish' ? 'มีโอกาสทดสอบแนวต้าน' : sentiment === 'bearish' ? 'ระวังแรงขายทำกำไร' : 'แกว่งตัวในกรอบ',
            priceTrendOutlook_en: sentiment === 'bullish' ? 'Potential test of resistance level' : sentiment === 'bearish' ? 'Exercise caution on pullback' : 'Range-bound consolidation'
          },
          isFeatured: false,
          isBookmarked: false,
          link: itemLink,
          url: itemLink,
          sourceUrl: itemLink
        };
      });

      setNewsCache.set(cleanTicker, { timestamp: Date.now(), data: items });
      return items;
    }
  } catch (err) {
    console.error(`[SET Live News] Error fetching live news for ${cleanTicker}:`, err);
  }

  return [];
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
