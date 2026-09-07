import Parser from 'rss-parser';
import type { StockNewsItem, MarketRegion, NewsCategory, SentimentType } from '../schemas/newsSchema';
import { mockNewsItems } from '../../data/mockNewsData';
import { fetchFinnhubCompanyNews, fetchFinnhubFilings } from './finnhubNewsService';
import { fetchSetStockNews } from './setNewsService';
import { classifyNewsIntelligence } from '../utils/newsClassifier';
import { enrichDualLanguageNewsItemAsync } from './deeplTranslationService';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
  },
  timeout: 8000
});

// Cache storage for live news
let cachedNews: StockNewsItem[] | null = null;
let newsCacheTime = 0;
const NEWS_CACHE_TTL_MS = 45_000; // 45 seconds

// Multi-Source RSS Feeds Configuration
const RSS_FEED_SOURCES = [
  // 1. Thai Top Financial Media Search
  {
    url: 'https://news.google.com/rss/search?q=site:kaohoon.com+OR+site:bangkokbiznews.com+OR+site:thunhoon.com+OR+site:prachachat.net+OR+site:thansettakij.com&hl=th&gl=TH&ceid=TH:th',
    category: 'thai' as MarketRegion,
    defaultSource: 'สำนักข่าวการเงินไทย',
    priority: 1
  },
  // 2. Specific Top SET Tickers Search
  {
    url: 'https://news.google.com/rss/search?q=(PTT+OR+DELTA+OR+CPALL+OR+KBANK+OR+SCB+OR+AOT+OR+ADVANC+OR+GULF+OR+BDMS)+AND+(%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99+OR+SET)&hl=th&gl=TH&ceid=TH:th',
    category: 'thai' as MarketRegion,
    defaultSource: 'SET Live Search',
    priority: 1
  },
  // 3. Thai SET & Economy Headlines
  {
    url: 'https://news.google.com/rss/search?q=%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99%E0%B9%84%E0%B8%97%E0%B8%A2+OR+SET50+OR+%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%B1%E0%B8%9E%E0%B8%A2%E0%B9%8B&hl=th&gl=TH&ceid=TH:th',
    category: 'thai' as MarketRegion,
    defaultSource: 'Google News ตลาดหุ้นไทย',
    priority: 2
  },
  // 4. Prachachat Direct Finance Feed
  {
    url: 'https://www.prachachat.net/finance/feed',
    category: 'thai' as MarketRegion,
    defaultSource: 'ประชาชาติธุรกิจ การเงิน',
    priority: 2
  },
  // 5. Global Markets: Yahoo Finance
  {
    url: 'https://finance.yahoo.com/news/rssindex',
    category: 'global' as MarketRegion,
    defaultSource: 'Yahoo Finance Global',
    priority: 1
  },
  // 6. Global Markets: CNBC Market Movers
  {
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664',
    category: 'global' as MarketRegion,
    defaultSource: 'CNBC Markets',
    priority: 2
  },
  // 7. Global Tech & AI Stocks
  {
    url: 'https://news.google.com/rss/search?q=(NVIDIA+OR+Apple+OR+Tesla+OR+Microsoft+OR+OpenAI+OR+"Wall+Street"+OR+"S%26P+500"+OR+Nasdaq)+AND+(stock+OR+shares+OR+market+OR+revenue)&hl=en-US&gl=US&ceid=US:en',
    category: 'global' as MarketRegion,
    defaultSource: 'Global Tech & AI Markets',
    priority: 2
  }
];

function formatRelativeTimeTh(dateStr: string): string {
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

function formatRelativeTimeEn(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
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
 * Fetch dedicated stock-specific news focusing on individual ticker
 * Multi-layer failover engine: SET Marketplace IR API + Thai Live RSS (Thai) | Finnhub News + SEC Filings (US)
 */
export async function fetchStockSpecificNews(ticker: string, marketHint?: string): Promise<StockNewsItem[]> {
  const cleanTicker = ticker.replace(/[\$\^\.]/g, '').replace(/BK$/, '').trim().toUpperCase();
  if (!cleanTicker) return [];

  const isThai = marketHint === 'SET' || ['PTT', 'CPALL', 'DELTA', 'AOT', 'KBANK', 'BDMS', 'SCB', 'GULF', 'ADVANC', 'TRUE', 'MINT', 'BBL', 'KTB', 'CRC', 'HMPRO', 'OR', 'CPN', 'LH', 'GPSC', 'EA', 'BGRIM', 'TOP'].includes(cleanTicker);

  if (isThai) {
    const thaiNews = await fetchSetStockNews(cleanTicker);
    if (thaiNews && thaiNews.length > 0) {
      return thaiNews;
    }
  } else {
    // For US stocks: Fetch both Finnhub Company News & SEC Regulatory Filings
    const [newsRes, filingsRes] = await Promise.allSettled([
      fetchFinnhubCompanyNews(cleanTicker),
      fetchFinnhubFilings(cleanTicker)
    ]);

    const combinedUs: StockNewsItem[] = [];
    if (newsRes.status === 'fulfilled' && Array.isArray(newsRes.value)) {
      combinedUs.push(...newsRes.value);
    }
    if (filingsRes.status === 'fulfilled' && Array.isArray(filingsRes.value)) {
      combinedUs.push(...filingsRes.value);
    }

    if (combinedUs.length > 0) {
      return combinedUs;
    }
  }

  return [];
}

/**
 * Main function to fetch live financial news from multiple real-world sources
 */
export async function fetchLiveAggregatedNews(): Promise<StockNewsItem[]> {
  const now = Date.now();
  if (cachedNews && now - newsCacheTime < NEWS_CACHE_TTL_MS && cachedNews.length > 0) {
    return cachedNews;
  }

  try {
    const feedPromises = RSS_FEED_SOURCES.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed.url);
        if (!feedData || !feedData.items) return [];

        const itemsToProcess = feedData.items.slice(0, 8);
        const enrichedItems: StockNewsItem[] = [];

        for (let itemIdx = 0; itemIdx < itemsToProcess.length; itemIdx++) {
          const item = itemsToProcess[itemIdx];
          const rawTitle = item.title || (feed.category === 'thai' ? 'ข่าวการเงินล่าสุด' : 'Latest Market News');
          const rawSnippet = item.contentSnippet || item.content || item.summary || item.title || '';
          const pubDate = item.pubDate || new Date().toISOString();
          
          const sourceName = item.source?.title || item.creator || feed.defaultSource;
          const relativeTimeTh = formatRelativeTimeTh(pubDate);
          const relativeTimeEn = formatRelativeTimeEn(pubDate);
          
          // Apply Master News Intelligence & SEO Cleaner with Financial Relevance Engine
          const intelligence = classifyNewsIntelligence(rawTitle, rawSnippet, feed.category, sourceName);

          // STRICT SAFE MODE FILTER: Drop items with Relevance Score < 50 (Weather, Culture, Gossip, Non-Financial)
          if (!intelligence.relevance.isAcceptable || intelligence.relevanceScore < 50) {
            continue;
          }

          const isThaiItem = intelligence.region === 'thai';
          const uniqueId = `live-${intelligence.region}-${itemIdx}-${Math.abs(hashString(intelligence.cleanTitle))}`;

          const rawItem: StockNewsItem = {
            id: uniqueId,
            title: intelligence.cleanTitle,
            title_th: intelligence.title_th,
            title_en: intelligence.title_en,
            summary: intelligence.cleanSummary,
            summary_th: intelligence.summary_th,
            summary_en: intelligence.summary_en,
            keyTakeaways: intelligence.keyTakeaways,
            keyTakeaways_th: intelligence.keyTakeaways_th,
            keyTakeaways_en: intelligence.keyTakeaways_en,
            fullContent: isThaiItem
              ? `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nรายงานสดจาก ${sourceName} • ข้อมูลสารสนเทศผ่านการประมวลผลโดยระบบ AI StockHomeTH`
              : `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nLive reporting from ${sourceName} • Financial intelligence processed by StockHomeTH AI`,
            fullContent_th: `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nรายงานสดจาก ${sourceName} • ข้อมูลสารสนเทศผ่านการประมวลผลโดยระบบ AI StockHomeTH`,
            fullContent_en: `${intelligence.cleanTitle}\n\n${intelligence.cleanSummary}\n\nLive reporting from ${sourceName} • Financial intelligence processed by StockHomeTH AI`,
            region: intelligence.region,
            timeframe: 'daily',
            marketName: intelligence.marketName,
            date: isThaiItem ? relativeTimeTh : relativeTimeEn,
            time: new Date(pubDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            periodLabel: isThaiItem ? `ข่าวสด Real-Time • ${relativeTimeTh}` : `Live News • ${relativeTimeEn}`,
            periodLabel_th: `ข่าวสด Real-Time • ${relativeTimeTh}`,
            periodLabel_en: `Live Real-Time • ${relativeTimeEn}`,
            sentiment: intelligence.sentiment,
            tickers: intelligence.tickers,
            readTime: isThaiItem ? '2 นาที' : '2 min',
            source: sourceName,
            category: intelligence.category,
            impactAnalysis: intelligence.impactAnalysis,
            relevanceScore: intelligence.relevanceScore,
            isFeatured: false,
            isBookmarked: false,
            link: item.link || (intelligence.region === 'thai' ? 'https://www.settrade.com' : 'https://finance.yahoo.com'),
            url: item.link || (intelligence.region === 'thai' ? 'https://www.settrade.com' : 'https://finance.yahoo.com'),
            sourceUrl: item.link || (intelligence.region === 'thai' ? 'https://www.settrade.com' : 'https://finance.yahoo.com')
          };

          const enriched = await enrichDualLanguageNewsItemAsync(rawItem);
          enrichedItems.push(enriched as StockNewsItem);
        }

        return enrichedItems;
      } catch (err) {
        return [];
      }
    });

    const feedResults = await Promise.allSettled(feedPromises);
    const combined: StockNewsItem[] = [];
    const seenTitles = new Set<string>();

    for (const res of feedResults) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        for (const item of res.value) {
          const simplified = item.title.slice(0, 30).toLowerCase();
          if (!seenTitles.has(simplified)) {
            seenTitles.add(simplified);
            combined.push(item);
          }
        }
      }
    }

    // Sort by Financial Relevance Score (Highest confidence 70-100 on top, 50-69 at bottom)
    combined.sort((a, b) => (b.relevanceScore ?? 60) - (a.relevanceScore ?? 60));

    if (combined.length > 0) {
      combined[0].isFeatured = true;
      cachedNews = combined;
      newsCacheTime = now;
      return combined;
    }
  } catch (error) {
    console.warn('[liveNewsAggregatorService] Aggregator warning:', error);
  }

  return mockNewsItems;
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
