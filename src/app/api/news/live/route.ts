import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { mockNewsItems } from '../../../../data/mockNewsData';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml; q=0.9, */*; q=0.8'
  },
  timeout: 8000
});

// Cache for live news (1 minute TTL so it stays fresh)
let cachedNews: any[] | null = null;
let newsCacheTime = 0;
const NEWS_CACHE_TTL_MS = 45_000; // 45 seconds

const RSS_FEEDS = [
  { url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=th&gl=TH&ceid=TH:th', category: 'thai', source: 'Google News ธุรกิจ (ไทย)' },
  { url: 'https://news.google.com/rss/search?q=หุ้นไทย+OR+ตลาดหลักทรัพย์+OR+SET+OR+PTT+OR+DELTA+OR+KBANK&hl=th&gl=TH&ceid=TH:th', category: 'thai', source: 'ข่าวหุ้นไทยสด (SET Search)' },
  { url: 'https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en', category: 'global', source: 'Google Finance (US & Global)' },
  { url: 'https://news.google.com/rss/search?q=NVIDIA+OR+Apple+OR+Tesla+OR+Microsoft+OR+Wall+Street&hl=en-US&gl=US&ceid=US:en', category: 'global', source: 'Global Tech & AI Markets' },
];

function extractTickers(text: string): string[] {
  const common = ['PTT', 'CPALL', 'DELTA', 'AOT', 'KBANK', 'GULF', 'BDMS', 'SCB', 'ADVANC', 'TRUE', 'NVDA', 'AAPL', 'TSLA', 'MSFT', 'GOOGL', 'META', 'AMZN', 'AMD', 'SET'];
  const matched = common.filter(t => new RegExp(`\\b${t}\\b`, 'i').test(text));
  return matched.length > 0 ? matched : ['SET', 'MARKET'];
}

function detectSentiment(text: string): 'bullish' | 'bearish' | 'neutral' {
  const bullishWords = ['พุ่ง', 'ทะยาน', 'โต', 'บวก', 'กำไร', 'หนุน', 'คึกคัก', 'เป้า', 'ฟื้น', 'ซื้อ', 'surges', 'jump', 'gain', 'profit', 'boost', 'rally', 'growth', 'record', 'high'];
  const bearishWords = ['ดิ่ง', 'ร่วง', 'ทรุด', 'ลบ', 'ขาดทุน', 'กังวล', 'เสี่ยง', 'กดดัน', 'ชะลอ', 'ขาย', 'plunges', 'drop', 'fall', 'loss', 'warning', 'decline', 'fears', 'cut'];

  const lower = text.toLowerCase();
  let bullCount = bullishWords.filter(w => lower.includes(w)).length;
  let bearCount = bearishWords.filter(w => lower.includes(w)).length;

  if (bullCount > bearCount) return 'bullish';
  if (bearCount > bullCount) return 'bearish';
  return 'neutral';
}

function detectCategory(text: string, defaultCat: 'thai' | 'global'): 'macro' | 'tech' | 'energy' | 'finance' | 'retail' | 'health' {
  const lower = text.toLowerCase();
  if (lower.includes('ชิป') || lower.includes('ai') || lower.includes('nvidia') || lower.includes('tech') || lower.includes('apple') || lower.includes('microsoft')) return 'tech';
  if (lower.includes('น้ำมัน') || lower.includes('ptt') || lower.includes('gulf') || lower.includes('energy') || lower.includes('ก๊าซ')) return 'energy';
  if (lower.includes('แบงก์') || lower.includes('kbank') || lower.includes('scb') || lower.includes('ดอกเบี้ย') || lower.includes('ธนาคาร') || lower.includes('fed')) return 'finance';
  if (lower.includes('ค้าปลีก') || lower.includes('cpall') || lower.includes('บริโภค') || lower.includes('ท่องเที่ยว')) return 'retail';
  if (lower.includes('รพ') || lower.includes('bdms') || lower.includes('การแพทย์') || lower.includes('ยา')) return 'health';
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

export async function GET() {
  const now = Date.now();
  if (cachedNews && now - newsCacheTime < NEWS_CACHE_TTL_MS) {
    return NextResponse.json({ success: true, source: 'cache', data: cachedNews });
  }

  try {
    const feedPromises = RSS_FEEDS.map(async (feed) => {
      try {
        const feedData = await parser.parseURL(feed.url);
        if (!feedData || !feedData.items) return [];
        return feedData.items.slice(0, 5).map((item) => {
          const rawTitle = item.title?.replace(/ - [^-]+$/, '').trim() || 'ข่าวการเงินล่าสุด';
          const snippet = item.contentSnippet?.slice(0, 220) || item.title || '';
          const pubDate = item.pubDate || new Date().toISOString();
          const tickers = extractTickers(`${rawTitle} ${snippet}`);
          const sentiment = detectSentiment(`${rawTitle} ${snippet}`);
          const category = detectCategory(`${rawTitle} ${snippet}`, feed.category as any);
          const sourceName = item.source?.title || item.creator || feed.source;

          return {
            id: `rss-${Math.random().toString(36).substring(2, 9)}`,
            title: rawTitle,
            summary: snippet,
            keyTakeaways: [
              `${rawTitle} - ติดตามผลกระทบต่อทิศทางราคาหุ้นและภาพรวมตลาด`,
              `การประเมินอารมณ์ตลาดจาก AI: ${sentiment === 'bullish' ? '🟢 เชิงบวก (Bullish)' : sentiment === 'bearish' ? '🔴 เชิงลบ (Bearish)' : '⚪ เป็นกลาง/ทรงตัว (Neutral)'}`,
              `หุ้นและสินทรัพย์ที่เกี่ยวข้อง: ${tickers.join(', ')}`
            ],
            fullContent: `${rawTitle}\n\n${snippet}\n\nรายงานสดจาก ${sourceName} • สามารถอ่านรายละเอียดฉบับเต็มได้ที่ลิงก์ต้นฉบับ`,
            region: feed.category,
            timeframe: 'daily',
            marketName: feed.category === 'thai' ? 'SET Index' : 'Global Markets',
            date: formatRelativeTime(pubDate),
            periodLabel: `ข่าวสด Real-Time • ${formatRelativeTime(pubDate)}`,
            sentiment,
            tickers,
            readTime: '2 นาที',
            audioDuration: '1:20',
            source: sourceName,
            category,
            impactAnalysis: {
              bullishReason: sentiment === 'bullish' ? 'แรงซื้อและมุมมองเชิงบวกต่อแนวโน้มธุรกิจ' : undefined,
              bearishReason: sentiment === 'bearish' ? 'แรงกดดันจากความผันผวนและปัจจัยเสี่ยงภายนอก' : undefined,
              targetSector: category === 'energy' ? 'พลังงาน & สาธารณูปโภค' : category === 'tech' ? 'เทคโนโลยี & AI' : category === 'finance' ? 'ธนาคาร & การเงิน' : 'เศรษฐกิจมหภาค',
              priceTrendOutlook: sentiment === 'bullish' ? 'มีโอกาสทดสอบแนวต้าน' : sentiment === 'bearish' ? 'ระวังแรงขายทำกำไร' : 'แกว่งตัวในกรอบ'
            },
            isFeatured: false,
            isBookmarked: false,
            link: item.link
          };
        });
      } catch (e) {
        return [];
      }
    });

    const feedResults = await Promise.allSettled(feedPromises);
    const allArticles: any[] = [];
    feedResults.forEach((res) => {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allArticles.push(...res.value);
      }
    });

    if (allArticles.length > 0) {
      allArticles[0].isFeatured = true;
      cachedNews = allArticles;
      newsCacheTime = now;
      return NextResponse.json({ success: true, source: 'live_rss_multifeed', count: allArticles.length, data: allArticles });
    }
  } catch (error: any) {
    console.warn('[News API] Live RSS multi-feed error, falling back:', error);
  }

  // Fallback
  return NextResponse.json({ success: true, source: 'seed', count: mockNewsItems.length, data: mockNewsItems });
}
