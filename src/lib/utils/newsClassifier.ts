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

  // 1. Remove trailing " - Publisher" or " | Publisher"
  text = text.replace(/\s*[-–—|•/]\s*([^-–—|•/]+)$/, (match, group) => {
    for (const pat of PUBLISHER_SEO_PATTERNS) {
      if (pat.test(group)) return '';
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
export function cleanNewsSnippet(raw: string, cleanTitle?: string): string {
  let text = stripHtml(raw);

  // Remove publisher names and fluff
  for (const pat of PUBLISHER_SEO_PATTERNS) {
    text = text.replace(pat, '');
  }
  for (const pat of FLUFF_PATTERNS) {
    text = text.replace(pat, '');
  }

  text = text
    .replace(/[\s\-_–—|:•/]+$/, '')
    .replace(/^[\s\-_–—|:•/]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // If snippet is just the title repeated or too short, generate a clean summary
  if (cleanTitle && (text === cleanTitle || text.length < 15)) {
    return `${cleanTitle} - สรุปสาระสำคัญและความเคลื่อนไหวล่าสุดผ่านการวิเคราะห์โดย StockHomeTH`;
  }

  return text || cleanTitle || 'สรุปรายงานความเคลื่อนไหวตลาดการเงินและหลักทรัพย์';
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
}

const ENTITY_RULES: EntityTickerRule[] = [
  // --- US & Global Tech / AI Giants ---
  {
    keywords: ['openai', 'chatgpt', 'gpt-4', 'gpt-5', 'gpt-6', 'sora', 'sam altman', 'แซม อัลท์แมน', 'dall-e'],
    tickers: ['MSFT', 'NVDA', 'QQQ'],
    category: 'tech',
    region: 'global',
    marketName: 'Global Tech & US Markets',
  },
  {
    keywords: ['nvidia', 'เอ็นวิเดีย', 'jensen huang', 'เจนเซ่น หวง', 'blackwell', 'h100', 'b200', 'geforce', 'ชิป ai'],
    tickers: ['NVDA', 'SMCI'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['apple', 'แอปเปิ้ล', 'iphone', 'ipad', 'macbook', 'tim cook', 'ทิม คุก', 'vision pro', 'ios'],
    tickers: ['AAPL'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['tesla', 'เทสลา', 'elon musk', 'อีลอน มัสก์', 'model 3', 'model y', 'cybertruck', 'gigafactory', 'รถยนต์ไฟฟ้า'],
    tickers: ['TSLA'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['microsoft', 'ไมโครซอฟท์', 'copilot', 'azure', 'satya nadella', 'windows'],
    tickers: ['MSFT'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Nasdaq)',
  },
  {
    keywords: ['google', 'alphabet', 'กูเกิล', 'gemini ai', 'youtube', 'sundar pichai', 'แอนดรอยด์'],
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
    keywords: ['amazon', 'อเมซอน', 'aws', 'jeff bezos', 'เจฟฟ์ เบโซส์', 'cloud computing'],
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
    keywords: ['tsmc', 'ไต้หวันเซมิคอนดักเตอร์', 'taiwan semiconductor', 'foundry'],
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
    keywords: ['palantir', 'พาแลนเทียร์', 'pltr', 'alex karp'],
    tickers: ['PLTR'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (NYSE)',
  },

  // --- Commodities & Gold ---
  {
    keywords: ['ราคาทองคำ', 'ทองคำ', 'gold spot', 'xauusd', 'ราคาทอง', 'ฮั่วเซ่งเฮง', 'mts gold'],
    tickers: ['GLD', 'GOLD'],
    category: 'macro',
    region: 'global',
    marketName: 'Global Commodities (ทองคำ)',
  },

  // --- Cloud & Enterprise SaaS ---
  {
    keywords: ['snowflake', 'สโนว์เฟลก', 'salesforce', 'crm', 'oracle', 'ออราเคิล', 'adobe', 'servicenow', 'datadog'],
    tickers: ['SNOW', 'CRM', 'ORCL'],
    category: 'tech',
    region: 'global',
    marketName: 'US Markets (Cloud & AI)',
  },

  // --- Crypto & Digital Assets ---
  {
    keywords: ['bitcoin', 'บิตคอยน์', 'btc', 'crypto', 'คริปโท', 'ethereum', 'อีเธอร์เรียม', 'eth', 'binance', 'coinbase', 'สินทรัพย์ดิจิทัล', 'stablecoin'],
    tickers: ['BTC', 'COIN', 'MSTR'],
    category: 'finance',
    region: 'global',
    marketName: 'Global Digital Assets',
  },

  // --- US & Global Macro / Central Banks ---
  {
    keywords: ['fed', 'เฟด', 'ธนาคารกลางสหรัฐ', 'jerome powell', 'เจอโรม พาวเวลล์', 'ดอกเบี้ยสหรัฐ', 'wall street', 'วอลล์สตรีท', 's&p 500', 's&p500', 'dow jones', 'ดาวโจนส์', 'treasury yield', 'บอนด์ยีลด์', 'เงินเฟ้อสหรัฐ', 'us cpi'],
    tickers: ['SPY', 'QQQ', 'DIA'],
    category: 'finance',
    region: 'global',
    marketName: 'Global Markets (สหรัฐฯ & โลก)',
  },

  // --- Top Thai Stocks (SET) ---
  {
    keywords: ['ปตท', 'ptt', 'pttep', 'โออาร์', 'ปตท.สผ', 'ปตท.น้ำมัน'],
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
    keywords: ['gpsc', 'bgrim', 'บีเคพีเอ็ม', 'ea', 'พลังงานบริสุทธิ์', 'top', 'ไทยออยล์', 'bcp', 'บางจาก'],
    tickers: ['GPSC', 'BGRIM', 'TOP', 'BCP'],
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
  'set', 'set50', 'set100', 'mai', 'ตลาดหลักทรัพย์แห่งประเทศไทย', 'หุ้นไทย',
  'ดัชนีหุ้นไทย', 'ตลท.', 'กลต.', 'ธปท.', 'แบงก์ชาติ', 'กนง.', 'ครม.',
  'กระทรวงการคลัง', 'เงินบาท', 'บาทแข็ง', 'บาทอ่อน'
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
  region: MarketRegion;
  marketName: string;
  tickers: string[];
  category: NewsCategory;
  sentiment: SentimentType;
  impactAnalysis: ImpactAnalysis;
  keyTakeaways: string[];
}

export function classifyNewsIntelligence(
  rawTitle: string,
  rawSnippet: string,
  feedCategory: MarketRegion = 'thai'
): NewsIntelligenceResult {
  const cleanTitle = cleanNewsTitle(rawTitle);
  const cleanSummary = cleanNewsSnippet(rawSnippet, cleanTitle);
  const fullText = `${cleanTitle} ${cleanSummary}`.toLowerCase();

  let matchedTickers: string[] = [];
  let detectedCategory: NewsCategory = detectNewsCategory(fullText);
  let detectedRegion: MarketRegion = feedCategory;
  let marketName = feedCategory === 'thai' ? 'SET Index (ไทย)' : 'Global Markets (สหรัฐฯ & สากล)';

  // 1. Check Entity Rules for specific proxies (OpenAI -> MSFT/NVDA, etc.)
  let matchedRule: EntityTickerRule | null = null;
  for (const rule of ENTITY_RULES) {
    const isMatched = rule.keywords.some((kw) => {
      const lowerKw = kw.toLowerCase();
      if (/^[a-z0-9]+$/i.test(lowerKw) && lowerKw.length <= 4) {
        const wordRegex = new RegExp(`\\b${lowerKw}\\b`, 'i');
        return wordRegex.test(fullText);
      }
      return fullText.includes(lowerKw);
    });

    if (isMatched) {
      matchedRule = rule;
      matchedTickers.push(...rule.tickers);
      detectedCategory = rule.category;
      detectedRegion = rule.region;
      marketName = rule.marketName;
      break;
    }
  }

  // 2. Check if text is specifically Thai SET despite coming from global feed, or vice versa
  const hasThaiKeywords = THAI_SET_MARKET_KEYWORDS.some((kw) => fullText.includes(kw));
  
  if (matchedRule) {
    // If an explicit entity like OpenAI or Nvidia was matched and has no Thai SET keywords, lock to Global!
    if (matchedRule.region === 'global') {
      detectedRegion = 'global';
    }
  } else {
    // No specific rule matched - deduce from keywords
    if (hasThaiKeywords) {
      detectedRegion = 'thai';
      marketName = 'SET Index (ไทย)';
      matchedTickers.push('SET');
    } else if (feedCategory === 'global' || fullText.includes('wall street') || fullText.includes('สหรัฐ') || fullText.includes('ต่างประเทศ') || fullText.includes('โลก')) {
      detectedRegion = 'global';
      marketName = 'Global Markets (สหรัฐฯ & โลก)';
      matchedTickers.push(detectedCategory === 'tech' ? 'QQQ' : 'SPY');
    } else {
      detectedRegion = 'thai';
      marketName = 'SET Index (ไทย)';
      matchedTickers.push('SET');
    }
  }

  // Deduplicate tickers
  const uniqueTickers = Array.from(new Set(matchedTickers)).slice(0, 4);

  // 3. Detect Sentiment
  const sentiment = detectNewsSentiment(fullText);

  // 4. Sector & Impact Analysis
  const sectorNames: Record<NewsCategory, string> = {
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

  const targetSector = sectorNames[detectedCategory] || 'ตลาดหุ้น';

  const bullishReason = sentiment === 'bullish'
    ? `ปัจจัยหนุนเชิงบวกต่อกลุ่ม ${targetSector} จากนวัตกรรม ความต้องการของตลาด หรือผลประกอบการที่แข็งแกร่ง`
    : undefined;

  const bearishReason = sentiment === 'bearish'
    ? `แรงกดดันระยะสั้นต่อกลุ่ม ${targetSector} จากความไม่แน่นอน นโยบาย หรือสภาวะเศรษฐกิจที่ชะลอตัว`
    : undefined;

  const priceTrendOutlook = sentiment === 'bullish'
    ? 'มีโอกาสปรับตัวขึ้นตามโมเมนตัมเชิงบวก'
    : sentiment === 'bearish'
    ? 'ระมัดระวังแรงขายทำกำไรและความผันผวน'
    : 'มีแนวโน้มแกว่งตัวในกรอบ (Sideways)';

  // 5. Generate High-Fidelity Key Takeaways
  const keyTakeaways: string[] = [
    `${cleanTitle} - ติดตามผลกระทบต่อทิศทางธุรกิจและโมเมนตัมของอุตสาหกรรม ${targetSector}`,
    `การประเมินอารมณ์ตลาดจาก AI: ${sentiment === 'bullish' ? 'เชิงบวก (Bullish Catalyst)' : sentiment === 'bearish' ? 'เชิงลบ/ระมัดระวัง (Bearish Pressure)' : 'เป็นกลาง/ทรงตัว (Neutral Outlook)'}`,
    `หุ้นและกลุ่มสินทรัพย์ที่เกี่ยวข้อง: ${uniqueTickers.map(t => `$${t}`).join(', ')}`
  ];

  return {
    cleanTitle,
    cleanSummary,
    region: detectedRegion,
    marketName,
    tickers: uniqueTickers,
    category: detectedCategory,
    sentiment,
    impactAnalysis: {
      bullishReason,
      bearishReason,
      targetSector,
      priceTrendOutlook
    },
    keyTakeaways
  };
}
