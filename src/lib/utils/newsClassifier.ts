/**
 * StockHomeTH - Financial News Intelligence & SEO Filtering Engine
 * 
 * Provides:
 * 1. Deep SEO & Publisher Signature Scrubbing (Removes trailing publisher names, clickbaits, SEO tags)
 * 2. Cross-Language Content-Aware Market & Region Classifier (Accurately identifies Thai vs Global/US)
 * 3. Smart Entity & Proxy Ticker Resolution (Maps OpenAI -> MSFT/NVDA, Tesla -> TSLA, PTT -> PTT)
 * 4. High-Precision Sector & Category Classification
 * 5. Accurate Market Sentiment & Impact Analysis Generator
 */

import type { MarketRegion, NewsCategory, SentimentType, ImpactAnalysis } from '../schemas/newsSchema';
import { calculateFinancialRelevance, type FinancialRelevanceResult } from './financialRelevanceEngine';

// ==========================================
// 1. SEO & PUBLISHER SIGNATURE PATTERNS
// ==========================================

const PUBLISHER_SEO_PATTERNS = [
  // Thai Financial & News Portals
  /ข่าวหุ้นธุรกิจออนไลน์/gi,
  /ข่าวหุ้นธุรกิจ/gi,
  /ข่าวหุ้น/gi,
  /kaohoon(?:\.com)?/gi,
  /กรุงเทพธุรกิจออนไลน์/gi,
  /กรุงเทพธุรกิจ/gi,
  /bangkokbiznews(?:\.com)?/gi,
  /ทันหุ้นออนไลน์/gi,
  /ทันหุ้น/gi,
  /thunhoon(?:\.com)?/gi,
  /มิติหุ้น/gi,
  /mitihoon(?:\.com)?/gi,
  /สำนักข่าวอินโฟเควสท์(?:\s*\(IQ\))?/gi,
  /อินโฟเควสท์/gi,
  /infoquest(?:\.co\.th)?/gi,
  /ประชาชาติธุรกิจ/gi,
  /ประชาชาติ/gi,
  /prachachat(?:\.net)?/gi,
  /ฐานเศรษฐกิจ/gi,
  /thansettakij(?:\.com)?/gi,
  /โพสต์ทูเดย์/gi,
  /posttoday(?:\.com)?/gi,
  /THE STANDARD WEALTH/gi,
  /THE STANDARD/gi,
  /เดอะสแตนดาร์ด/gi,
  /Money Buffalo/gi,
  /มันนี่บัฟฟาโล/gi,
  /efinancethai(?:\.com)?/gi,
  /อีไฟแนนซ์ไทย/gi,
  /สำนักข่าวไทย/gi,
  /ผู้จัดการออนไลน์/gi,
  /MGR Online/gi,
  /ไทยรัฐออนไลน์/gi,
  /ไทยรัฐ/gi,
  /thairath(?:\.co\.th)?/gi,
  /เดลินิวส์/gi,
  /dailynews/gi,
  /สำนักข่าว กรมประชาสัมพันธ์/gi,
  /ThaiPR\.NET/gi,
  /RYT9/gi,
  /Settrade/gi,

  // Global Financial Portals
  /Investing\.com/gi,
  /Yahoo Finance/gi,
  /CNBC/gi,
  /Bloomberg/gi,
  /Reuters/gi,
  /MarketWatch/gi,
  /Wall Street Journal/gi,
  /Financial Times/gi,
  /Seeking Alpha/gi,
  /BenZinga/gi,
  /Barron's/gi,
  /Forbes/gi
];

const FLUFF_PATTERNS = [
  /อ่านต่อได้ที่\s*[:\.]?.*/gi,
  /คลิกอ่าน(?:เพิ่มเติม)?\s*[:\.]?.*/gi,
  /อ่านรายละเอียด(?:เพิ่มเติม)?\s*[:\.]?.*/gi,
  /ติดตามต่อ(?:ได้ที่)?\s*[:\.]?.*/gi,
  /\(รายละเอียด\)/gi,
  /\(เพิ่มเติม\)/gi,
  /\(ชมคลิป\)/gi,
  /ดูรายละเอียด/gi,
  /www\.[a-z0-9\-]+\.[a-z]{2,}(?:\/[^\s]*)?/gi,
  /https?:\/\/[^\s]+/gi
];

/**
 * Remove HTML tags, entities, and excessive whitespace
 */
export function stripHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean SEO tags and publisher signatures from news title
 */
export function cleanNewsTitle(raw: string): string {
  let text = stripHtml(raw);

  // 1. Remove trailing " - Publisher Name" commonly appended by RSS/Google News
  text = text.replace(/\s*[-–—|]\s*([A-Za-z0-9\u0E00-\u0E7F\.\s]{2,40})$/, (match, group) => {
    // If the trailing segment is a known publisher or short source name, strip it
    for (const pat of PUBLISHER_SEO_PATTERNS) {
      if (pat.test(group)) return '';
    }
    // Also strip generic domain names or known portal suffixes
    if (/\.(com|co\.th|net|org|io)$/i.test(group) || /thaiticketmajor|google|yahoo|reuters|cnbc|bloomberg|prachachat|bangkokbiz/i.test(group)) {
      return '';
    }
    return match;
  });

  // 2. Remove all publisher names wherever they appear
  for (const pat of PUBLISHER_SEO_PATTERNS) {
    text = text.replace(pat, '');
  }

  // 3. Remove fluff
  for (const pat of FLUFF_PATTERNS) {
    text = text.replace(pat, '');
  }

  // 4. Remove dangling punctuation and separators
  text = text
    .replace(/[\s\-_–—|:•/]+$/, '')
    .replace(/^[\s\-_–—|:•/]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return text || raw.trim();
}

/**
 * Clean SEO tags and boilerplate phrases from news snippet/summary
 */
export function cleanNewsSnippet(raw: string, cleanTitle?: string, isThai?: boolean): string {
  let text = stripHtml(raw);

  // Remove publisher names and fluff
  for (const pat of PUBLISHER_SEO_PATTERNS) {
    text = text.replace(pat, '');
  }
  for (const pat of FLUFF_PATTERNS) {
    text = text.replace(pat, '');
  }

  // If the snippet starts with the clean title, strip the title portion to avoid duplication
  if (cleanTitle && cleanTitle.length > 5) {
    const titleRegex = new RegExp(`^${cleanTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—|:•/]*\\s*`, 'i');
    text = text.replace(titleRegex, '');
  }

  text = text
    .replace(/[\s\-_–—|:•/]+$/, '')
    .replace(/^[\s\-_–—|:•/]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If the remaining snippet is identical to title or too short (< 20 chars), return empty string so classifier can synthesize an authentic executive summary
  if (cleanTitle && (text.toLowerCase() === cleanTitle.toLowerCase() || text.length < 20)) {
    return '';
  }

  return text;
}

// ==========================================
// 2. SMART ENTITY & PROXY TICKER MAPPINGS
// ==========================================

interface EntityTickerRule {
  keywords: string[];
  tickers: string[];
  category: NewsCategory;
  region: MarketRegion;
  marketName: string;
  isMacroRule?: boolean;
}

const ENTITY_RULES: EntityTickerRule[] = [
  // --- US & Global Tech / AI Giants ---
  {
    keywords: ['openai', 'chatgpt', 'gpt-4', 'gpt-5', 'gpt-6', 'sora', 'sam altman', 'แซม อัลท์แมน', 'dall-e'],
    tickers: ['MSFT'],
    category: 'tech',
    region: 'global',
    marketName: 'Global Tech & US Markets',
  },
  {
    keywords: ['nvidia', 'เอ็นวิเดีย', 'jensen huang', 'เจนเซ่น หวง', 'blackwell', 'h100', 'b200', 'geforce', 'nvda'],
    tickers: ['NVDA'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['super micro', 'supermicro', 'smci', 'charles liang'],
    tickers: ['SMCI'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['apple', 'แอปเปิ้ล', 'iphone', 'ipad', 'macbook', 'tim cook', 'ทิม คุก', 'vision pro', 'ios', 'aapl'],
    tickers: ['AAPL'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['tesla', 'เทสลา', 'elon musk', 'อีลอน มัสก์', 'model 3', 'model y', 'cybertruck', 'gigafactory', 'tsla'],
    tickers: ['TSLA'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['microsoft', 'ไมโครซอฟท์', 'copilot', 'azure', 'satya nadella', 'windows', 'msft'],
    tickers: ['MSFT'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['google', 'alphabet', 'กูเกิล', 'gemini ai', 'youtube', 'sundar pichai', 'googl', 'goog'],
    tickers: ['GOOGL'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['meta', 'facebook', 'เมตา', 'เฟซบุ๊ก', 'instagram', 'zuckerberg', 'ซักเคอร์เบิร์ก', 'llama'],
    tickers: ['META'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['amazon', 'อเมซอน', 'aws', 'jeff bezos', 'เจฟฟ์ เบโซส์', 'cloud computing', 'amzn'],
    tickers: ['AMZN'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['amd', 'advanced micro devices', 'lisa su', 'ลิซ่า ซู', 'ryzen', 'radeon'],
    tickers: ['AMD'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['tsmc', 'ไต้หวันเซมิคอนดักเตอร์', 'taiwan semiconductor', 'foundry', 'tsm'],
    tickers: ['TSM'],
    category: 'tech',
    region: 'global',
    marketName: 'Global Tech (NYSE/TWSE)',
  },
  {
    keywords: ['asml', 'lithography', 'euv'],
    tickers: ['ASML'],
    category: 'tech',
    region: 'global',
    marketName: 'Global Tech (Nasdaq/AEX)',
  },
  {
    keywords: ['palantir', 'พาแลนเทียร์', 'pltr', 'alex karp', 'palantir technologies'],
    tickers: ['PLTR'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (NYSE)',
  },
  {
    keywords: ['salesforce', 'เซลส์ฟอร์ซ', 'crm', 'marc benioff'],
    tickers: ['CRM'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (NYSE)',
  },
  {
    keywords: ['broadcom', 'บรอดคอม', 'avgo', 'hock tan'],
    tickers: ['AVGO'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['oracle', 'ออราเคิล', 'orcl', 'larry ellison'],
    tickers: ['ORCL'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (NYSE)',
  },
  {
    keywords: ['snowflake', 'สโนว์เฟลก', 'snow'],
    tickers: ['SNOW'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (NYSE)',
  },

  // --- Crypto & Digital Assets ---
  {
    keywords: ['bitcoin', 'บิตคอยน์', 'btc', 'crypto', 'คริปโท', 'ethereum', 'อีเธอร์เรียม', 'eth', 'binance', 'coinbase', 'สินทรัพย์ดิจิทัล', 'stablecoin'],
    tickers: ['BTC', 'COIN'],
    category: 'finance',
    region: 'global',
    marketName: 'Global Digital Assets',
  },

  // --- US & Global Macro / Central Banks (Proxy macro only) ---
  {
    keywords: ['fed', 'เฟด', 'ธนาคารกลางสหรัฐ', 'jerome powell', 'เจอโรม พาวเวลล์', 'ดอกเบี้ยสหรัฐ', 'wall street', 'วอลล์สตรีท', 's&p 500', 's&p500', 'dow jones', 'ดาวโจนส์', 'treasury yield', 'บอนด์ยีลด์', 'เงินเฟ้อสหรัฐ', 'us cpi'],
    tickers: ['SPY', 'QQQ', 'DIA'],
    category: 'macro',
    region: 'global',
    marketName: 'Global Markets (สหรัฐฯ & โลก)',
    isMacroRule: true,
  },

  // --- Top Thai Stocks (SET) ---
  {
    keywords: ['ปตท', 'ptt', 'pttep', 'โออาร์', 'ปตท.สผ', 'ปตท.น้ำมัน', 'ไทยออยล์', 'top', 'bcp', 'บางจาก'],
    tickers: ['PTT', 'PTTEP', 'OR'],
    category: 'energy',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['เดลต้า', 'delta', 'delta electronics', 'อิเล็กทรอนิกส์'],
    tickers: ['DELTA'],
    category: 'tech',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['กสิกร', 'kbank', 'ธนาคารกสิกรไทย'],
    tickers: ['KBANK'],
    category: 'finance',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['ไทยพาณิชย์', 'scb', 'scbx', 'เอสซีบี'],
    tickers: ['SCB'],
    category: 'finance',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['ซีพี ออลล์', 'เซเว่น', 'cpall', 'cpf', 'ซีพีเอฟ', 'cp extra', 'cpaxt'],
    tickers: ['CPALL', 'CPF', 'CPAXT'],
    category: 'retail',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['กัลฟ์', 'gulf', 'สารัชถ์', 'โรงไฟฟ้ากัลฟ์'],
    tickers: ['GULF'],
    category: 'energy',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['การบินไทย', 'ทอท', 'ท่าอากาศยานไทย', 'aot', 'สนามบินสุวรรณภูมิ'],
    tickers: ['AOT'],
    category: 'retail',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['กรุงเทพดุสิต', 'โรงพยาบาลกรุงเทพ', 'bdms', 'บำรุงราษฎร์', 'bh'],
    tickers: ['BDMS', 'BH'],
    category: 'health',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['แอดวานซ์', 'เอไอเอส', 'advanc', 'ais', 'ทรู', 'true corporation', 'true'],
    tickers: ['ADVANC', 'TRUE'],
    category: 'telecom',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['กรุงเทพ', 'bbl', 'ธนาคารกรุงเทพ', 'กรุงไทย', 'ktb', 'ธนาคารกรุงไทย', 'ttb', 'ทีทีบี'],
    tickers: ['BBL', 'KTB', 'TTB'],
    category: 'finance',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['เซ็นทรัลพัฒนา', 'cpn', 'เซ็นทรัล รีเทล', 'crc', 'ห้างเซ็นทรัล', 'โฮมโปร', 'hmpro'],
    tickers: ['CPN', 'CRC', 'HMPRO'],
    category: 'retail',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['ไมเนอร์', 'mint', 'minor international', 'โรงแรมเซ็นทารา', 'centel'],
    tickers: ['MINT', 'CENTEL'],
    category: 'retail',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['gpsc', 'bgrim', 'บีเคพีเอ็ม', 'ea', 'พลังงานบริสุทธิ์'],
    tickers: ['GPSC', 'BGRIM'],
    category: 'energy',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  },
  {
    keywords: ['แลนด์ แอนด์ เฮ้าส์', 'lh', 'ศุภาลัย', 'spali', 'แสนสิริ', 'siri', 'เอพี', 'ap', 'wha', 'อมตะ', 'amata'],
    tickers: ['LH', 'SPALI', 'SIRI', 'AP', 'WHA', 'AMATA'],
    category: 'realestate',
    region: 'thai',
    marketName: 'SET Index (ไทย)',
  }
];

// Explicit SET Keywords
const THAI_SET_MARKET_KEYWORDS = [
  'set', 'set50', 'set100', 'mai', 'ตลาดหลักทรัพย์แห่งประเทศไทย', 'ตลาดหุ้นไทย', 'หุ้นไทย',
  'ดัชนีหุ้นไทย', 'ตลท.', 'กลต.', 'ธปท.', 'แบงก์ชาติ', 'กนง.', 'ครม.',
  'กระทรวงการคลัง', 'เงินบาท', 'บาทแข็ง', 'บาทอ่อน', 'xd', 'หุ้นใหญ่', 'พ.ร.บ.', 'งบประมาณ', 'งบฯ', 'โบรกฯ', 'บล.', 'บลจ.'
];

// ==========================================
// 3. SENTIMENT & IMPACT ANALYSIS ENGINE
// ==========================================

export function detectNewsSentiment(text: string): SentimentType {
  const bullishWords = [
    'พุ่ง', 'ทะยาน', 'โต', 'บวก', 'กำไร', 'หนุน', 'คึกคัก', 'เป้า', 'ฟื้น', 'ซื้อ', 'เซอร์ไพรส์',
    'แจกปันผล', 'สถิติใหม่', 'เปิดตัว', 'ขยาย', 'จับมือ', 'คว้างาน', 'เพิ่มทุนสำเร็จ', 'ออลไทม์ไฮ',
    'surges', 'jump', 'gain', 'profit', 'boost', 'rally', 'growth', 'record', 'high', 'beat', 'bullish', 'upgrade', 'outperform'
  ];
  const bearishWords = [
    'ดิ่ง', 'ร่วง', 'ทรุด', 'ลบ', 'ขาดทุน', 'กังวล', 'เสี่ยง', 'กดดัน', 'ชะลอ', 'ขาย', 'ระวัง',
    'หั่นเป้า', 'ถูกปรับลด', 'ผิดนัด', 'ฟ้องร้อง', 'ปิดกิจการ', 'ชะงัก', 'เงินเฟ้อพุ่ง', 'ตึงเครียด',
    'plunges', 'drop', 'fall', 'loss', 'warning', 'decline', 'fears', 'cut', 'slump', 'bearish', 'downgrade', 'underperform'
  ];

  const lower = text.toLowerCase();
  let bullScore = 0;
  let bearScore = 0;

  for (const w of bullishWords) {
    if (lower.includes(w)) bullScore++;
  }
  for (const w of bearishWords) {
    if (lower.includes(w)) bearScore++;
  }

  if (bullScore > bearScore) return 'bullish';
  if (bearScore > bullScore) return 'bearish';
  return 'neutral';
}

export function detectNewsCategory(text: string): NewsCategory {
  const lower = text.toLowerCase();

  // 1. Tech & AI
  if (
    lower.includes('ai') || lower.includes('ชิป') || lower.includes('semiconductor') ||
    lower.includes('tech') || lower.includes('ซอฟต์แวร์') || lower.includes('ดาต้าเซ็นเตอร์') ||
    lower.includes('ไซเบอร์') || lower.includes('เขียนโค้ด') || lower.includes('หุ่นยนต์') ||
    lower.includes('openai') || lower.includes('cloud') || lower.includes('อิเล็กทรอนิกส์')
  ) {
    return 'tech';
  }

  // 2. Energy & Utilities
  if (
    lower.includes('น้ำมัน') || lower.includes('oil') || lower.includes('brent') ||
    lower.includes('wti') || lower.includes('opec') || lower.includes('พลังงาน') ||
    lower.includes('ก๊าซ') || lower.includes('โรงไฟฟ้า') || lower.includes('โซลาร์') ||
    lower.includes('พลังงานหมุนเวียน') || lower.includes('ev') || lower.includes('แบตเตอรี่')
  ) {
    return 'energy';
  }

  // 3. Finance & Banking
  if (
    lower.includes('แบงก์') || lower.includes('ธนาคาร') || lower.includes('ดอกเบี้ย') ||
    lower.includes('fed') || lower.includes('เฟด') || lower.includes('ธปท') || lower.includes('กนง') ||
    lower.includes('สินเชื่อ') || lower.includes('เงินเฟ้อ') || lower.includes('การเงิน') ||
    lower.includes('คริปโท') || lower.includes('bitcoin') || lower.includes('ประกัน')
  ) {
    return 'finance';
  }

  // 4. Retail & Consumer
  if (
    lower.includes('ค้าปลีก') || lower.includes('ห้าง') || lower.includes('บริโภค') ||
    lower.includes('อาหาร') || lower.includes('เครื่องดื่ม') || lower.includes('ท่องเที่ยว') ||
    lower.includes('โรงแรม') || lower.includes('การบิน') || lower.includes('consumer')
  ) {
    return 'retail';
  }

  // 5. Healthcare & Medical
  if (
    lower.includes('รพ') || lower.includes('โรงพยาบาล') || lower.includes('การแพทย์') ||
    lower.includes('ยา') || lower.includes('สุขภาพ') || lower.includes('วัคซีน') ||
    lower.includes('healthcare') || lower.includes('ชีวการแพทย์')
  ) {
    return 'health';
  }

  // 6. Telecom
  if (
    lower.includes('โทรคมนาคม') || lower.includes('5g') || lower.includes('6g') ||
    lower.includes('สื่อสาร') || lower.includes('เน็ตบ้าน') || lower.includes('คลื่นความถี่')
  ) {
    return 'telecom';
  }

  // 7. Real Estate
  if (
    lower.includes('อสังหา') || lower.includes('บ้าน') || lower.includes('คอนโด') ||
    lower.includes('ที่ดิน') || lower.includes('reit') || lower.includes('นิคม')
  ) {
    return 'realestate';
  }

  return 'macro';
}

// ==========================================
// 4. MASTER NEWS INTELLIGENCE CLASSIFIER
// ==========================================

export interface NewsIntelligenceResult {
  cleanTitle: string;
  cleanSummary: string;
  relevance: FinancialRelevanceResult;
  relevanceScore: number;
  relevanceLevel: 'high' | 'moderate' | 'low';
  region: MarketRegion;
  marketName: string;
  tickers: string[];
  category: NewsCategory;
  sentiment: SentimentType;
  impactAnalysis: ImpactAnalysis;
  keyTakeaways: string[];
  title_th?: string;
  title_en?: string;
  summary_th?: string;
  summary_en?: string;
  keyTakeaways_th?: string[];
  keyTakeaways_en?: string[];
}

export function classifyNewsIntelligence(
  rawTitle: string,
  rawSnippet: string,
  feedCategory: MarketRegion = 'thai',
  sourceName: string = ''
): NewsIntelligenceResult {
  const cleanTitle = cleanNewsTitle(rawTitle);
  const isThai = /[\u0E00-\u0E7F]/.test(cleanTitle) || feedCategory === 'thai';
  const cleanSummary = cleanNewsSnippet(rawSnippet, cleanTitle, isThai);
  const fullText = `${cleanTitle} ${cleanSummary}`.toLowerCase();

  // Compute Financial Relevance & Weight
  const relevance = calculateFinancialRelevance(cleanTitle, cleanSummary, sourceName);

  let matchedTickers: string[] = [];
  let detectedCategory: NewsCategory = detectNewsCategory(fullText);
  let detectedRegion: MarketRegion = feedCategory;
  let marketName = feedCategory === 'thai' ? 'SET Index (ไทย)' : 'US / Global Markets';

  // Check if text has strong Thai SET market indicators
  const hasThaiSetKeywords = THAI_SET_MARKET_KEYWORDS.some((kw) => {
    if (kw.length <= 3) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9\u0E00-\u0E7F])${kw}([^a-zA-Z0-9\u0E00-\u0E7F]|$)`, 'i');
      return regex.test(fullText);
    }
    return fullText.includes(kw);
  });

  const isFundamentallyThai = feedCategory === 'thai' || hasThaiSetKeywords;

  // 1. Check all Entity Rules and prioritize by appearance position in headline first, then summary
  interface MatchCandidate {
    rule: EntityTickerRule;
    position: number;
    inTitle: boolean;
  }

  const matchedCandidates: MatchCandidate[] = [];
  const lowerTitle = cleanTitle.toLowerCase();
  const lowerSummary = cleanSummary.toLowerCase();

  for (const rule of ENTITY_RULES) {
    // If the article is fundamentally a Thai market story, ignore generic US macro rules
    if (isFundamentallyThai && rule.isMacroRule) {
      continue;
    }

    let bestPos = Infinity;
    let foundInTitle = false;

    for (const kw of rule.keywords) {
      const lowerKw = kw.toLowerCase();
      let posInTitle = -1;
      let posInSummary = -1;

      if (/^[a-z0-9]+$/i.test(lowerKw) && lowerKw.length <= 4) {
        const regex = new RegExp(`\\b${lowerKw}\\b`, 'i');
        const matchTitle = lowerTitle.search(regex);
        const matchSum = lowerSummary.search(regex);
        posInTitle = matchTitle;
        posInSummary = matchSum;
      } else {
        posInTitle = lowerTitle.indexOf(lowerKw);
        posInSummary = lowerSummary.indexOf(lowerKw);
      }

      if (posInTitle !== -1 && posInTitle < bestPos) {
        bestPos = posInTitle;
        foundInTitle = true;
      } else if (posInSummary !== -1 && !foundInTitle && (1000 + posInSummary) < bestPos) {
        bestPos = 1000 + posInSummary;
      }
    }

    if (bestPos !== Infinity) {
      matchedCandidates.push({
        rule,
        position: bestPos,
        inTitle: foundInTitle
      });
    }
  }

  // Sort candidates so the entity appearing earliest in the headline is primary
  matchedCandidates.sort((a, b) => a.position - b.position);

  let matchedRule: EntityTickerRule | null = null;
  if (matchedCandidates.length > 0) {
    matchedRule = matchedCandidates[0].rule;

    // Only inherit category from rule if not macro, or if rule is company-specific
    if (matchedRule.category) {
      detectedCategory = matchedRule.category;
    }
    detectedRegion = matchedRule.region;
    marketName = matchedRule.marketName;

    // For the primary candidate, take its tickers
    for (const tkr of matchedRule.tickers) {
      if (!matchedTickers.includes(tkr)) {
        matchedTickers.push(tkr);
      }
    }

    // If other candidates also appear in the headline, add their primary ticker
    for (let i = 1; i < matchedCandidates.length; i++) {
      if (matchedCandidates[i].inTitle) {
        for (const tkr of matchedCandidates[i].rule.tickers) {
          if (!matchedTickers.includes(tkr)) {
            matchedTickers.push(tkr);
          }
        }
      }
    }
  }

  // 2. Region & SET Fallback Harmonization
  if (isFundamentallyThai) {
    // Lock region to Thai
    detectedRegion = 'thai';
    marketName = 'SET Index (ไทย)';
    if (matchedTickers.length === 0) {
      matchedTickers.push('SET');
    }
  } else if (!matchedRule) {
    if (feedCategory === 'global' || fullText.includes('wall street') || fullText.includes('สหรัฐ') || fullText.includes('ต่างประเทศ') || fullText.includes('โลก')) {
      detectedRegion = 'global';
      marketName = 'US / Global Markets';
      matchedTickers.push(detectedCategory === 'tech' ? 'QQQ' : 'SPY');
    } else {
      detectedRegion = 'thai';
      marketName = 'SET Index (ไทย)';
      matchedTickers.push('SET');
    }
  }

  // Deduplicate tickers and keep top 4 sorted by relevance
  const uniqueTickers = Array.from(new Set(matchedTickers)).slice(0, 4);

  // 3. Detect Sentiment
  const sentiment = detectNewsSentiment(fullText);

  // 4. Sector & Impact Analysis Dictionary
  const sectorNamesTh: Record<NewsCategory, string> = {
    all: 'ภาพรวมตลาด',
    macro: 'เศรษฐกิจมหภาค & นโยบายการเงิน',
    tech: 'เทคโนโลยี, AI & เซมิคอนดักเตอร์',
    energy: 'พลังงาน, น้ำมัน & สาธารณูปโภค',
    finance: 'ธนาคาร, การเงิน & สินทรัพย์ดิจิทัล',
    retail: 'ค้าปลีก, อาหาร & การบริโภค',
    telecom: 'โทรคมนาคม & การสื่อสาร',
    realestate: 'อสังหาริมทรัพย์ & นิคมอุตสาหกรรม',
    health: 'การแพทย์ โรงพยาบาล & สุขภาพ'
  };

  const sectorNamesEn: Record<NewsCategory, string> = {
    all: 'Broad Market',
    macro: 'Macroeconomics & Monetary Policy',
    tech: 'Technology, AI & Semiconductors',
    energy: 'Energy, Oil & Utilities',
    finance: 'Banking, Financials & Digital Assets',
    retail: 'Retail Commerce & Consumer Goods',
    telecom: 'Telecommunications & Media',
    realestate: 'Real Estate & Industrial Parks',
    health: 'Healthcare, Hospitals & BioMed'
  };

  const targetSectorTh = sectorNamesTh[detectedCategory] || 'ตลาดหุ้น';
  const targetSectorEn = sectorNamesEn[detectedCategory] || 'Equities Market';
  const tickerListTh = uniqueTickers.length === 1 && uniqueTickers[0] === 'SET'
    ? 'SET Index'
    : uniqueTickers.map(t => `$${t}`).join(', ');
  const tickerListEn = uniqueTickers.length === 1 && uniqueTickers[0] === 'SET'
    ? 'SET Index'
    : uniqueTickers.map(t => `$${t}`).join(', ');

  const bullishReasonTh = sentiment === 'bullish'
    ? `ปัจจัยหนุนเชิงบวกต่อกลุ่ม ${targetSectorTh} จากนวัตกรรม ความต้องการของตลาด หรือผลประกอบการที่แข็งแกร่ง`
    : undefined;
  const bullishReasonEn = sentiment === 'bullish'
    ? `Bullish catalyst for ${targetSectorEn} driven by strong market demand, technological tailwinds, or resilient earnings`
    : undefined;

  const bearishReasonTh = sentiment === 'bearish'
    ? `แรงกดดันระยะสั้นต่อกลุ่ม ${targetSectorTh} จากความไม่แน่นอน นโยบาย หรือสภาวะเศรษฐกิจที่ชะลอตัว`
    : undefined;
  const bearishReasonEn = sentiment === 'bearish'
    ? `Near-term pressure on ${targetSectorEn} from macroeconomic uncertainties, policy shifts, or market volatility`
    : undefined;

  const priceTrendOutlookTh = sentiment === 'bullish'
    ? 'มีโอกาสปรับตัวขึ้นตามโมเมนตัมเชิงบวก'
    : sentiment === 'bearish'
    ? 'ระมัดระวังแรงขายทำกำไรและความผันผวน'
    : 'มีแนวโน้มแกว่งตัวในกรอบ (Sideways)';

  const priceTrendOutlookEn = sentiment === 'bullish'
    ? 'Expected upward momentum on positive catalyst'
    : sentiment === 'bearish'
    ? 'Caution advised on potential profit-taking and volatility'
    : 'Range-bound consolidation (Sideways)';

  // 5. Intelligent Executive Summary Generator (Non-repetitive, High-Value Synthesis)
  let executiveSummaryTh = isThai && cleanSummary ? cleanSummary : '';
  let executiveSummaryEn = !isThai && cleanSummary ? cleanSummary : '';

  if (!executiveSummaryTh) {
    if (sentiment === 'bullish') {
      executiveSummaryTh = `รายงานความเคลื่อนไหวสำคัญของกลุ่ม${targetSectorTh} (${tickerListTh}): ตลาดตอบรับปัจจัยบวกและการเติบโตของธุรกิจ ช่วยเพิ่มความเชื่อมั่นแก่นักลงทุน โดยมีแนวโน้ม${priceTrendOutlookTh}`;
    } else if (sentiment === 'bearish') {
      executiveSummaryTh = `รายงานประเด็นสำคัญของกลุ่ม${targetSectorTh} (${tickerListTh}): เผชิญแรงกดดันระยะสั้นและความผันผวนจากสภาวะตลาด นักลงทุนควรระมัดระวังความเสี่ยงและ${priceTrendOutlookTh}`;
    } else {
      executiveSummaryTh = `รายงานสารสนเทศและภาพรวมของกลุ่ม${targetSectorTh} (${tickerListTh}): สะท้อนความเคลื่อนไหวตามรอบการเปิดเผยข้อมูลและการประเมินมูลค่าตามปัจจัยพื้นฐานในปัจจุบัน`;
    }
  }

  if (!executiveSummaryEn) {
    if (sentiment === 'bullish') {
      executiveSummaryEn = `Executive intelligence for ${targetSectorEn} (${tickerListEn}): Market sentiment is buoyed by expanding business catalysts and solid sector tailwinds, with ${priceTrendOutlookEn.toLowerCase()}.`;
    } else if (sentiment === 'bearish') {
      executiveSummaryEn = `Executive intelligence for ${targetSectorEn} (${tickerListEn}): Highlights near-term headwinds and market volatility, warranting careful risk assessment as ${priceTrendOutlookEn.toLowerCase()}.`;
    } else {
      executiveSummaryEn = `Executive intelligence for ${targetSectorEn} (${tickerListEn}): Overview of recent corporate disclosures and baseline fundamental consolidation.`;
    }
  }

  // 6. Distinct Dual-Language Key Takeaways (Never repeating the headline)
  const keyTakeawaysTh: string[] = [
    `ประเด็นขับเคลื่อนหลัก: สารสนเทศในกลุ่ม${targetSectorTh} ส่งผลโดยตรงต่อทิศทางการดำเนินงานและโครงสร้างความต้องการของตลาด`,
    `การประเมินอารมณ์ตลาดจาก AI: ${sentiment === 'bullish' ? 'เชิงบวก (Bullish Catalyst)' : sentiment === 'bearish' ? 'เชิงลบ/ระมัดระวัง (Bearish Pressure)' : 'เป็นกลาง/ทรงตัว (Neutral Outlook)'} — ${priceTrendOutlookTh}`,
    `หุ้นและสินทรัพย์เป้าหมาย: ${tickerListTh} • สรุปสาระสำคัญผ่านระบบ AI StockHomeTH`
  ];

  const keyTakeawaysEn: string[] = [
    `Core Market Driver: Key catalyst in ${targetSectorEn} directly influencing operational momentum and sector positioning.`,
    `AI Sentiment Assessment: ${sentiment === 'bullish' ? 'Bullish Catalyst' : sentiment === 'bearish' ? 'Bearish Pressure' : 'Neutral Outlook'} — ${priceTrendOutlookEn}`,
    `Target Equities & Assets: ${tickerListEn} • Synthesized by StockHomeTH Intelligence Engine`
  ];

  const finalSummary = isThai ? executiveSummaryTh : executiveSummaryEn;

  return {
    cleanTitle,
    cleanSummary: finalSummary,
    relevance,
    relevanceScore: relevance.score,
    relevanceLevel: relevance.level,
    region: detectedRegion,
    marketName,
    tickers: uniqueTickers,
    category: detectedCategory,
    sentiment,
    impactAnalysis: {
      bullishReason: isThai ? bullishReasonTh : bullishReasonEn,
      bullishReason_th: bullishReasonTh,
      bullishReason_en: bullishReasonEn,
      bearishReason: isThai ? bearishReasonTh : bearishReasonEn,
      bearishReason_th: bearishReasonTh,
      bearishReason_en: bearishReasonEn,
      targetSector: isThai ? targetSectorTh : targetSectorEn,
      targetSector_th: targetSectorTh,
      targetSector_en: targetSectorEn,
      priceTrendOutlook: isThai ? priceTrendOutlookTh : priceTrendOutlookEn,
      priceTrendOutlook_th: priceTrendOutlookTh,
      priceTrendOutlook_en: priceTrendOutlookEn,
    },
    keyTakeaways: isThai ? keyTakeawaysTh : keyTakeawaysEn,
    keyTakeaways_th: keyTakeawaysTh,
    keyTakeaways_en: keyTakeawaysEn,
    title_th: isThai ? cleanTitle : undefined,
    title_en: !isThai ? cleanTitle : undefined,
    summary_th: executiveSummaryTh,
    summary_en: executiveSummaryEn,
  };
}
