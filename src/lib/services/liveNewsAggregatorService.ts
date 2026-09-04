import Parser from 'rss-parser';
import type { StockNewsItem, MarketRegion, NewsCategory, SentimentType } from '../schemas/newsSchema';
import { mockNewsItems } from '../../data/mockNewsData';

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
  // 1. Thai Top Financial Media Search (Kaohoon, Bangkokbiznews, Thunhoon, Prachachat, Thansettakij)
  {
    url: 'https://news.google.com/rss/search?q=site:kaohoon.com+OR+site:bangkokbiznews.com+OR+site:thunhoon.com+OR+site:prachachat.net+OR+site:thansettakij.com&hl=th&gl=TH&ceid=TH:th',
    category: 'thai' as MarketRegion,
    defaultSource: 'สำนักข่าวการเงินไทย (Kaohoon / กรุงเทพธุรกิจ / ทันหุ้น)',
    priority: 1
  },
  // 2. Specific Top SET 10 Tickers Search
  {
    url: 'https://news.google.com/rss/search?q=PTT+OR+DELTA+OR+CPALL+OR+KBANK+OR+SCB+OR+AOT+OR+ADVANC+OR+GULF+OR+BDMS+OR+TRUE&hl=th&gl=TH&ceid=TH:th',
    category: 'thai' as MarketRegion,
    defaultSource: 'ข่าวหุ้นรายตัว (SET Live Search)',
    priority: 1
  },
  // 3. Thai SET & Economy Headlines
  {
    url: 'https://news.google.com/rss/search?q=%E0%B8%AB%E0%B8%B8%E0%B9%89%E0%B8%99%E0%B9%84%E0%B8%97%E0%B8%A2+OR+SET+OR+%E0%B8%95%E0%B8%A5%E0%B8%B2%E0%B8%94%E0%B8%AB%E0%B8%A5%E0%B8%B1%E0%B8%81%E0%B8%97%E0%B8%A3%E0%B8%B1%E0%B8%9E%E0%B8%A2%E0%B9%8B&hl=th&gl=TH&ceid=TH:th',
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
    url: 'https://news.google.com/rss/search?q=NVIDIA+OR+Apple+OR+Tesla+OR+Microsoft+OR+Wall+Street&hl=en-US&gl=US&ceid=US:en',
    category: 'global' as MarketRegion,
    defaultSource: 'Global Tech & AI Markets',
    priority: 2
  }
];

const KNOWN_TICKERS = [
  // SET 10
  'PTT', 'CPALL', 'DELTA', 'AOT', 'KBANK', 'BDMS', 'SCB', 'GULF', 'ADVANC', 'TRUE',
  // Popular Thai
  'MINT', 'BBL', 'KTB', 'CRC', 'HMPRO', 'OR', 'CPN', 'LH', 'GPSC', 'EA', 'BGRIM', 'TOP',
  // US Tech Giants
  'NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD',
  // Index
  'SET', 'SET50', 'MAI', 'NASDAQ', 'S&P500'
];

function extractTickers(text: string, defaultCategory: MarketRegion): string[] {
  const upper = text.toUpperCase();
  const matched: string[] = [];

  for (const t of KNOWN_TICKERS) {
    const regex = new RegExp(`\\b${t}\\b`, 'i');
    if (regex.test(text) || upper.includes(t)) {
      matched.push(t);
    }
  }

  // Thai stock name heuristics
  if (text.includes('ปตท') && !matched.includes('PTT')) matched.push('PTT');
  if (text.includes('เดลต้า') && !matched.includes('DELTA')) matched.push('DELTA');
  if (text.includes('กสิกร') && !matched.includes('KBANK')) matched.push('KBANK');
  if (text.includes('ไทยพาณิชย์') && !matched.includes('SCB')) matched.push('SCB');
  if (text.includes('ซีพี ออลล์') || text.includes('เซเว่น')) matched.push('CPALL');
  if (text.includes('การบินไทย') || text.includes('ทอท') || text.includes('สนามบิน')) matched.push('AOT');
  if (text.includes('กัลฟ์') && !matched.includes('GULF')) matched.push('GULF');
  if (text.includes('กรุงเทพดุสิต') || text.includes('โรงพยาบาลกรุงเทพ')) matched.push('BDMS');
  if (text.includes('เอไอเอส') || text.includes('แอดวานซ์')) matched.push('ADVANC');
  if (text.includes('ทรู') && !matched.includes('TRUE')) matched.push('TRUE');

  if (matched.length > 0) {
    return Array.from(new Set(matched)).slice(0, 4);
  }

  return defaultCategory === 'thai' ? ['SET'] : ['US'];
}

function detectSentiment(text: string): SentimentType {
  const bullishWords = [
    'พุ่ง', 'ทะยาน', 'โต', 'บวก', 'กำไร', 'หนุน', 'คึกคัก', 'เป้า', 'ฟื้น', 'ซื้อ', 'เซอร์ไพรส์', 'แจกปันผล',
    'surges', 'jump', 'gain', 'profit', 'boost', 'rally', 'growth', 'record', 'high', 'beat', 'bullish', 'upgrade'
  ];
  const bearishWords = [
    'ดิ่ง', 'ร่วง', 'ทรุด', 'ลบ', 'ขาดทุน', 'กังวล', 'เสี่ยง', 'กดดัน', 'ชะลอ', 'ขาย', 'ระวัง', 'หั่นเป้า',
    'plunges', 'drop', 'fall', 'loss', 'warning', 'decline', 'fears', 'cut', 'slump', 'bearish', 'downgrade'
  ];

  const lower = text.toLowerCase();
  let bullCount = bullishWords.filter((w) => lower.includes(w)).length;
  let bearCount = bearishWords.filter((w) => lower.includes(w)).length;

  if (bullCount > bearCount) return 'bullish';
  if (bearCount > bullCount) return 'bearish';
  return 'neutral';
}

function detectCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();
  if (lower.includes('ชิป') || lower.includes('ai') || lower.includes('nvidia') || lower.includes('tech') || lower.includes('apple') || lower.includes('microsoft') || lower.includes('semiconductor') || lower.includes('openai')) return 'tech';
  if (lower.includes('น้ำมัน') || lower.includes('ptt') || lower.includes('gulf') || lower.includes('energy') || lower.includes('ก๊าซ') || lower.includes('โรงไฟฟ้า') || lower.includes('brent') || lower.includes('opec')) return 'energy';
  if (lower.includes('แบงก์') || lower.includes('kbank') || lower.includes('scb') || lower.includes('ดอกเบี้ย') || lower.includes('ธนาคาร') || lower.includes('fed') || lower.includes('ธปท') || lower.includes('การเงิน') || lower.includes('เงินเฟ้อ')) return 'finance';
  if (lower.includes('ค้าปลีก') || lower.includes('cpall') || lower.includes('บริโภค') || lower.includes('ท่องเที่ยว') || lower.includes('ห้าง') || lower.includes('อาหาร') || lower.includes('central')) return 'retail';
  if (lower.includes('รพ') || lower.includes('bdms') || lower.includes('การแพทย์') || lower.includes('ยา') || lower.includes('สุขภาพ') || lower.includes('healthcare')) return 'health';
  return 'macro';
}

function formatRelativeTime(dateStr: string): string {
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

function cleanHtmlTags(str: string): string {
  return str.replace(/<\/?[^>]+(>|$)/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim();
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

        return feedData.items.slice(0, 8).map((item) => {
          const rawTitle = cleanHtmlTags(item.title?.replace(/ - [^-]+$/, '').trim() || 'ข่าวการเงินล่าสุด');
          const snippet = cleanHtmlTags(item.contentSnippet || item.content || item.summary || item.title || '').slice(0, 240);
          const pubDate = item.pubDate || new Date().toISOString();
          const combinedText = `${rawTitle} ${snippet}`;
          
          const tickers = extractTickers(combinedText, feed.category);
          const sentiment = detectSentiment(combinedText);
          const category = detectCategory(combinedText);
          const sourceName = item.source?.title || item.creator || feed.defaultSource;

          // Target sector label
          const sectorMap: Record<NewsCategory, string> = {
            all: 'ภาพรวมทุกอุตสาหกรรม',
            macro: 'เศรษฐกิจมหภาค & ภาพรวมตลาด',
            tech: 'เทคโนโลยี, ชิปประมวลผล & AI',
            energy: 'พลังงาน น้ำมัน & สาธารณูปโภค',
            finance: 'ธนาคาร การเงิน & ดอกเบี้ย',
            retail: 'ค้าปลีก อาหาร & การบริโภค',
            telecom: 'โทรคมนาคม & สื่อสาร',
            realestate: 'อสังหาริมทรัพย์ & กองทรัสต์',
            health: 'การแพทย์ โรงพยาบาล & สุขภาพ'
          };

          const targetSector = sectorMap[category] || 'ตลาดหุ้น';

          const bullishReason = sentiment === 'bullish'
            ? `แรงหนุนเชิงบวกต่อกลุ่ม ${targetSector} จากผลการดำเนินงานและแนวโน้มการเติบโต`
            : undefined;

          const bearishReason = sentiment === 'bearish'
            ? `แรงกดดันระยะสั้นต่อกลุ่ม ${targetSector} จากความผันผวนและความไม่แน่นอนของตลาด`
            : undefined;

          const priceTrendOutlook = sentiment === 'bullish'
            ? 'มีโอกาสปรับตัวขึ้นทดสอบแนวต้านสำคัญ'
            : sentiment === 'bearish'
            ? 'ระมัดระวังแรงขายทำกำไรและแรงกดดันแนวรับ'
            : 'มีแนวโน้มแกว่งตัวในกรอบ (Sideways)';

          const uniqueId = `live-${Math.abs(hashString(rawTitle))}`;

          const newsItem: StockNewsItem = {
            id: uniqueId,
            title: rawTitle,
            summary: snippet.length > 10 ? snippet : `${rawTitle} - สรุปสาระสำคัญพร้อมวิเคราะห์ผลกระทบต่อราคาหุ้นและตลาดทุนโดย AI StockHomeTH`,
            keyTakeaways: [
              `${rawTitle} - ติดตามผลกระทบต่อทิศทางราคาหุ้นและภาพรวมตลาด`,
              `การประเมินอารมณ์ตลาดจาก AI: ${sentiment === 'bullish' ? '🟢 เชิงบวก (Bullish)' : sentiment === 'bearish' ? '🔴 เชิงลบ (Bearish)' : '⚪ เป็นกลาง/ทรงตัว (Neutral)'}`,
              `หุ้นและกลุ่มสินทรัพย์ที่เกี่ยวข้อง: ${tickers.map(t => `$${t}`).join(', ')}`
            ],
            fullContent: `${rawTitle}\n\n${snippet}\n\nรายงานสดจาก ${sourceName} • ข้อมูลได้รับการประมวลผลและเชื่อมโยงเข้ากับระบบวิเคราะห์หุ้นอัตโนมัติของ StockHomeTH`,
            region: feed.category,
            timeframe: 'daily',
            marketName: feed.category === 'thai' ? 'SET Index (ไทย)' : 'Global Markets (สหรัฐฯ & โลก)',
            date: formatRelativeTime(pubDate),
            time: new Date(pubDate).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
            periodLabel: `ข่าวสด Real-Time • ${formatRelativeTime(pubDate)}`,
            sentiment,
            tickers,
            readTime: '2 นาที',
            source: sourceName,
            category,
            impactAnalysis: {
              bullishReason,
              bearishReason,
              targetSector,
              priceTrendOutlook
            },
            isFeatured: false,
            isBookmarked: false
          };

          return newsItem;
        });
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

    if (combined.length > 0) {
      combined[0].isFeatured = true;
      cachedNews = combined;
      newsCacheTime = now;
      return combined;
    }
  } catch (error) {
    console.warn('[liveNewsAggregatorService] Aggregator warning:', error);
  }

  // Graceful fallback to verified news seed
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
