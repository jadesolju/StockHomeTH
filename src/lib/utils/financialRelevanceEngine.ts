/**
 * StockHomeTH - Financial Relevance & Weight Scoring Engine
 * 
 * Accurately scores news items (0 - 100) based on financial relevance:
 * - Score 70 - 100: High confidence financial intelligence (Ranked at the top)
 * - Score 50 - 69: Moderate relevance (General macro / Commodities, displayed at bottom)
 * - Score < 50: Low / Irrelevant (100% Dropped / Filtered out to avoid clutter)
 */

export interface FinancialRelevanceResult {
  score: number; // 0 to 100
  level: 'high' | 'moderate' | 'low';
  isAcceptable: boolean; // true if score >= 50
  signals: string[];
}

// 1. High-Impact Stock, Company & Major Institution Identifiers (+45 points)
const HIGH_IMPACT_TICKER_PATTERNS = [
  /\b(PTT|PTTEP|DELTA|CPALL|CPF|CPAXT|KBANK|SCB|SCBX|BBL|KTB|TTB|AOT|ADVANC|TRUE|GULF|BDMS|BH|MINT|CENTEL|CPN|CRC|HMPRO|LH|SPALI|SIRI|AP|WHA|AMATA|GPSC|BGRIM|EA|TOP|BCP|OR|BANPU|IVL|IRPC)\b/i,
  /\b(NVDA|NVIDIA|AAPL|APPLE|MSFT|MICROSOFT|GOOGL|GOOGLE|AMZN|AMAZON|META|TSLA|TESLA|AMD|SMCI|PLTR|ASML|TSM|TSMC|AVGO|ARM|INTC|QCOM)\b/i,
  /\b(SET|SET50|SET100|mai|S&P\s*500|NASDAQ|DOW\s*JONES|NIKKEI|HANG\s*SENG|WALL\s*STREET|FED|FOMC)\b/i,
  /\b(ปตท|เดลต้า|ซีพีออลล์|กสิกร|ไทยพาณิชย์|กรุงเทพดุสิต|การบินไทย|กัลฟ์|แอดวานซ์|เฟด|ธปท\.|กนง\.|กลต\.)\b/i
];

// 2. Financial Metrics, Price Action & Market Terms (+15 to +35 points)
const FINANCIAL_METRIC_KEYWORDS = [
  'ผลประกอบการ', 'ผลการดำเนินงาน', 'กำไรสุทธิ', 'ขาดทุนสุทธิ', 'งบการเงิน', 'งบ q', 'รายได้รวม',
  'ปันผล', 'แจกปันผล', 'xd', 'เพิ่มทุน', 'ipo', 'เทนเดอร์', 'ebitda', 'roe', 'roa',
  'earnings', 'revenue', 'net income', 'dividend', 'guidance', 'operating margin',
  'market cap', 'shares', 'quarterly results', 'stock split', 'all-time high', 'ออลไทม์ไฮ',
  'ราคาหุ้น', 'ปิดบวก', 'ปิดลบ', 'ปรับตัวขึ้น', 'ปรับตัวลง', 'ชิป ai', 'ai chip', 'เซมิคอนดักเตอร์',
  'data center', 'ศูนย์ข้อมูล', 'ซื้อสุทธิ', 'ขายสุทธิ', 'วอลุ่ม'
];

// 3. Central Banks, Monetary Policy & Macroeconomics (+20 to +35 points)
const MACRO_POLICY_KEYWORDS = [
  'เฟด', 'fed', 'fomc', 'federal reserve', 'ดอกเบี้ยนโยบาย', 'ลดดอกเบี้ย', 'ขึ้นดอกเบี้ย', 'ดอกเบี้ย',
  'เงินเฟ้อ', 'เงินเฟ้อทั่วไป', 'เงินเฟ้อพื้นฐาน', 'cpi', 'ppi', 'gdp', 'ดุลการค้า', 'ส่งออก', 'นำเข้า',
  'fund flow', 'ต่างชาติซื้อสุทธิ', 'บอนด์ยีลด์', 'treasury yield', 'ธปท.', 'กลต.', 'กนง.',
  'กระทรวงการคลัง', 'กระทรวงพาณิชย์', 'ดัชนีราคาผู้บริโภค', 'ดัชนีหุ้น', 'ตลาดหลักทรัพย์'
];

// 4. Commodities, Energy & Digital Assets (+20 to +30 points)
const COMMODITY_ASSET_KEYWORDS = [
  'ราคาทองคำ', 'ทองคำแท่ง', 'spot gold', 'xauusd', 'น้ำมันดิบ', 'brent', 'wti', 'opec',
  'คริปโท', 'bitcoin', 'btc', 'ethereum', 'eth', 'สินทรัพย์ดิจิทัล', 'ค่าเงินบาท', 'บาทแข็ง', 'บาทอ่อน'
];

// 5. Recognized Financial Media & Sources (+20 points)
const FINANCIAL_SOURCE_PATTERNS = [
  /kaohoon|ข่าวหุ้น/i,
  /thunhoon|ทันหุ้น/i,
  /bangkokbiznews|กรุงเทพธุรกิจ/i,
  /prachachat|ประชาชาติธุรกิจ/i,
  /thansettakij|ฐานเศรษฐกิจ/i,
  /efinancethai|อีไฟแนนซ์ไทย/i,
  /the\s*standard\s*wealth/i,
  /money\s*buffalo/i,
  /mitihoon|มิติหุ้น/i,
  /settrade/i,
  /infoquest|อินโฟเควสท์/i,
  /bloomberg|reuters|cnbc|yahoo\s*finance|marketwatch|wall\s*street\s*journal|investing\.com|benzinga|seeking\s*alpha|barron/i
];

// 6. Strong Negative Signals: Non-financial domains (-60 to -75 points)
const NON_FINANCIAL_BLOCK_PATTERNS = [
  // Weather & Natural alerts without market impact
  { pattern: /กรมอุตุนิยมวิทยา|กรมอุตุ|พยากรณ์อากาศ|ฝนตกหนัก|สภาพอากาศ|ลมหนาว|คลื่นลมแรง|พายุหมุน|เรดาร์ฝน/i, penalty: 70, tag: 'Weather/Meteorological' },
  
  // Entertainment, Celebrities & Drama
  { pattern: /ดารา|ดาราสาว|พระเอก|นางเอก|คนบันเทิง|วงการบันเทิง|คอนเสิร์ต|แฟนคลับ|คู่จิ้น|ไฮโซ|เลิกรา|เปิดตัวแฟน|งานแต่ง|ชุดว่ายน้ำ|บิกินี่|แซ่บ/i, penalty: 70, tag: 'Entertainment/Gossip' },
  
  // Culture, Religion, Horoscopes, Festivals
  { pattern: /ดวงชะตา|ดูดวง|หมอลักษณ์|หมอช้าง|ราศี|เลขเด็ด|หวยงวดนี้|สลากกินแบ่ง|เสี่ยงโชค|บุญบั้งไฟ|สืบสานประเพณี|พิธีศักดิ์สิทธิ์|พระเกจิ|ทอดกฐิน|ผ้าป่า/i, penalty: 70, tag: 'Culture/Religion/Horoscope' },
  
  // Sports without business context
  { pattern: /ฟุตบอล|พรีเมียร์ลีก|แมนยู|ลิเวอร์พูล|อาร์เซนอล|เชลซี|ผลบอล|ไฮไลท์บอล|วอลเลย์บอล|มวย|โอลิมปิก|ซีเกมส์|ยูโร\s*20/i, penalty: 70, tag: 'Sports' },
  
  // Crime & Local Accidents
  { pattern: /อุบัติเหตุ|รถชน|ไฟไหม้บ้าน|ฆาตกรรม|ยิงกัน|ตำรวจจับ|บุกรวบ|ยาเสพติด|แก๊งคอลเซ็นเตอร์|โจร|ชิงทรัพย์/i, penalty: 60, tag: 'Crime/Accident' }
];

/**
 * Calculates the Financial Relevance Score (0 - 100) for a given news item.
 */
export function calculateFinancialRelevance(
  title: string,
  snippet: string = '',
  sourceName: string = ''
): FinancialRelevanceResult {
  const fullText = `${title} ${snippet}`.trim();
  const lowerText = fullText.toLowerCase();
  const lowerSource = sourceName.toLowerCase();

  let score = 0;
  const signals: string[] = [];

  // --- Step 1: Base Financial Source Check (+20) ---
  let isDedicatedFinancialSource = false;
  for (const srcPat of FINANCIAL_SOURCE_PATTERNS) {
    if (srcPat.test(lowerSource) || srcPat.test(lowerText)) {
      score += 20;
      isDedicatedFinancialSource = true;
      signals.push('Financial Media Source (+20)');
      break;
    }
  }

  // --- Step 2: High-Impact Tickers & Institutions (+45) ---
  let hasHighImpactTicker = false;
  for (const tickPat of HIGH_IMPACT_TICKER_PATTERNS) {
    if (tickPat.test(fullText)) {
      score += 45;
      hasHighImpactTicker = true;
      signals.push('Explicit Stock/Company Entity (+45)');
      break;
    }
  }

  // --- Step 3: Financial Metrics & Earnings (+15 to +30) ---
  let metricCount = 0;
  for (const kw of FINANCIAL_METRIC_KEYWORDS) {
    if (lowerText.includes(kw)) {
      metricCount++;
    }
  }
  if (metricCount >= 2) {
    score += 30;
    signals.push(`Multiple Earnings/Financial Metrics (+30)`);
  } else if (metricCount === 1) {
    score += 18;
    signals.push(`Single Financial Metric (+18)`);
  }

  // --- Step 4: Macroeconomic & Central Bank Terms (+20 to +35) ---
  let macroCount = 0;
  for (const kw of MACRO_POLICY_KEYWORDS) {
    if (lowerText.includes(kw)) {
      macroCount++;
    }
  }
  if (macroCount >= 2) {
    score += 35;
    signals.push(`Macro Policy & Institutional Terms (+35)`);
  } else if (macroCount === 1) {
    score += 22;
    signals.push(`Macroeconomic Term (+22)`);
  }

  // --- Step 5: Commodities & Digital Assets (+20 to +30) ---
  let commodityCount = 0;
  for (const kw of COMMODITY_ASSET_KEYWORDS) {
    if (lowerText.includes(kw)) {
      commodityCount++;
    }
  }
  if (commodityCount >= 1) {
    const pts = commodityCount >= 2 ? 30 : 22;
    score += pts;
    signals.push(`Commodities/Digital Assets (+${pts})`);
  }

  // --- Step 6: Negative Non-Financial Blocklist ---
  for (const block of NON_FINANCIAL_BLOCK_PATTERNS) {
    if (block.pattern.test(fullText)) {
      // If it has explicit company stock entity and multiple financial metrics, mitigate penalty
      if (hasHighImpactTicker && (metricCount >= 1 || macroCount >= 1)) {
        score -= Math.floor(block.penalty * 0.3);
        signals.push(`Mitigated Penalty: ${block.tag}`);
      } else {
        score -= block.penalty;
        signals.push(`Heavy Penalty: ${block.tag} (-${block.penalty})`);
      }
    }
  }

  // --- Step 7: Length / Noise Check ---
  if (fullText.length < 20) {
    score -= 15;
    signals.push('Snippet Too Short (-15)');
  }

  // Normalize score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine Level:
  // - High (>= 70): Core financial & stock news (top priority)
  // - Moderate (50 - 69): Secondary macro/commodities (shown at bottom)
  // - Low (< 50): Filtered out / Dropped (100% hidden)
  let level: 'high' | 'moderate' | 'low';
  if (score >= 70) {
    level = 'high';
  } else if (score >= 50) {
    level = 'moderate';
  } else {
    level = 'low';
  }

  return {
    score,
    level,
    isAcceptable: score >= 50,
    signals
  };
}
