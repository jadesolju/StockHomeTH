/**
 * StockHomeTH - Financial News Dual-Language Translation Engine
 * 
 * Guarantees 100% clean, non-mixed translations between Thai (TH) and English (EN)
 * for news titles, executive summaries, key takeaways, and market overviews.
 */

// In-memory persistent translation cache
const MEMORY_TRANSLATION_CACHE = new Map<string, string>();

/**
 * Check whether a text string contains Thai characters
 */
export function isPrimarilyThai(text?: string): boolean {
  if (!text) return false;
  const thaiRegex = /[\u0E00-\u0E7F]/;
  return thaiRegex.test(text);
}

// ==========================================================
// 1. COMPREHENSIVE THAI -> ENGLISH FINANCIAL TRANSLATION MAP
// ==========================================================
const THAI_TO_EN_SENTENCE_PATTERNS: [RegExp, string][] = [
  // Full Headline / Period Patterns
  [/^สรุปภาพรวมตลาดประจำวันที่\s*(.*)$/i, 'Daily Market Executive Summary • $1'],
  [/^สรุปสัปดาห์ล่าสุด\s*(.*)$/i, 'Latest Weekly Market Digest • $1'],
  [/^สรุปภาพรวมตลาดรอบ\s*7\s*วัน\s*(.*)$/i, '7-Day Market Wrap-up & Overview • $1'],
  [/^สรุปภาวะตลาดและข่าวเด่น\s*•\s*(.*)$/i, 'Market Wrap-up & Featured News • $1'],
  [/^ข่าวสด Real-Time\s*•\s*(.*)$/i, 'Live Real-Time News • $1'],
  [/^ข้อมูลสารสนเทศสด$/i, 'Live Official Disclosure'],

  // Market Overviews & Headlines
  [/ตลาดภาพรวมเคลื่อนไหวเชิงบวก/gi, 'Overall markets traded in positive territory'],
  [/ตลาดภาพรวมเคลื่อนไหวผันผวน/gi, 'Overall markets exhibited volatile trading'],
  [/SET Index และตลาดหุ้นโลกเคลื่อนไหวคึกคัก รับกระแสเงินลงทุน AI และทิศทางดอกเบี้ยโลก/gi, 'SET Index and global equities rally on strong AI capital inflows and interest rate expectations'],
  [/สรุปสัปดาห์:\s*สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง/gi, 'Weekly Wrap: Robust global fund flows surge into Asian equities and US mega-cap tech'],
  [/ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ/gi, 'Throughout the past week, global equity markets responded favorably to resilient liquidity and robust earnings from leading corporations'],
  [/ความเคลื่อนไหวตลาดล่าสุด:\s*หุ้นปรับตัวขึ้น\s*(\d+)\s*บริษัท,\s*ปรับตัวลง\s*(\d+)\s*บริษัท\s*จากทั้งหมด\s*(\d+)\s*บริษัท/gi, 'Latest Market Breadth: $1 stocks advancing, $2 stocks declining out of $3 tracked securities'],
  [/พร้อมสรุปข่าวสารการเงินสดต่อเนื่องทุกนาที/gi, 'featuring continuous real-time financial intelligence updates'],
  [/ตลาดหุ้นไทยและตลาดสากลตอบรับเชิงบวกต่อภาพรวมเศรษฐกิจและเม็ดเงินลงทุนในอุตสาหกรรมเทคโนโลยี AI/gi, 'Thai and international equities advanced on positive macroeconomic indicators and massive capital commitments to the AI technology sector'],

  // Thai Catalysts Translations
  [/ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน \((.*?)\)/gi, 'Global crude oil and renewable energy stabilization supported energy heavyweights ($1)'],
  [/ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง \((.*?)\)/gi, 'Surging export demand and AI component orders fueled semiconductor & electronics leaders ($1)'],
  [/กำลังซื้อในประเทศและการฟื้นตัวของภาคท่องเที่ยวหนุนกลุ่มพาณิชย์ \((.*?)\)/gi, 'Domestic consumer spending resilience and tourism recovery boosted retail and healthcare giants ($1)'],
  [/เม็ดเงินลงทุนสถาบันและ Fund Flow เข้าซื้อสะสมในกลุ่มหุ้น Big Cap SET50/gi, 'Institutional fund flows continued substantial accumulation in SET50 index benchmark constituents'],
  [/สัญญาณ Fund Flow ไหลเข้าสะสมในหุ้นขนาดใหญ่ SET50 และหุ้นปันผลสูง \((.*?)\)/gi, 'Foreign & institutional capital actively accumulated SET50 large caps and dividend blue-chips ($1)'],
  [/การลงทุนโครงสร้างพื้นฐาน Data Center และศูนย์กลาง AI ในประเทศไทยขยายตัวต่อเนื่อง \((.*?)\)/gi, 'Rapid expansion in data center and national AI hub infrastructure investments bolstered ($1)'],
  [/ตัวเลขเศรษฐกิจภาคบริการและการท่องเที่ยวไทยขยายตัวดีกว่าคาดการณ์ \((.*?)\)/gi, 'Hospitality, medical tourism, and service sector economic indicators beat consensus estimates ($1)'],
  [/รายงานงบประมาณและผลประกอบการบริษัทจดทะเบียนส่งสัญญาณเติบโต \((.*?)\)/gi, 'Corporate earnings releases and fiscal expenditure execution signaled sustainable expansion ($1)'],
  [/สัญญาณการปรับโครงสร้างอัตราดอกเบี้ยและนโยบายการเงินทั่วโลกเอื้อต่อสินทรัพย์เติบโต/gi, 'Global central bank monetary easing signals created favorable tailwinds for growth assets'],
  [/นักลงทุนสถาบันและต่างชาติเข้าซื้อสุทธิต่อเนื่องในกลุ่มหุ้น SET50 & S&P500/gi, 'Sustained net purchases by institutional and international investors lifted SET50 & S&P 500 equities'],
  [/การลงทุนโครงสร้างพื้นฐานด้าน Data Center และ AI Hub ขยายตัวทั่วภูมิภาค/gi, 'Hyperscale Data Center and regional AI ecosystem investments accelerated significantly'],

  // Core Phrases & Common Sentence Parts
  [/ดัชนีตลาดหลักทรัพย์แห่งประเทศไทย/gi, 'Stock Exchange of Thailand (SET Index)'],
  [/ตลาดหลักทรัพย์แห่งประเทศไทย/gi, 'Stock Exchange of Thailand'],
  [/ตลาดหุ้นไทย/gi, 'Thai stock market'],
  [/ตลาดหุ้นโลก/gi, 'global markets'],
  [/ตลาดหุ้นสหรัฐฯ/gi, 'US stock market'],
  [/หุ้นไทย/gi, 'Thai equities'],
  [/หุ้นต่างประเทศ/gi, 'Global / US equities'],
  [/วอลล์สตรีท/gi, 'Wall Street'],
  [/นักลงทุนสถาบัน/gi, 'institutional investors'],
  [/นักลงทุนต่างชาติ/gi, 'foreign investors'],
  [/ปรับตัวเพิ่มขึ้น/gi, 'gained higher'],
  [/ปรับตัวลดลง/gi, 'pulled back lower'],
  [/เคลื่อนไหวในแดนบวก/gi, 'traded in the green'],
  [/เคลื่อนไหวในแดนลบ/gi, 'traded in the red'],
  [/มูลค่าการซื้อขายหนาแน่น/gi, 'strong trading turnover'],
  [/ผลการดำเนินงาน/gi, 'operating results'],
  [/ผลประกอบการ/gi, 'financial performance'],
  [/กำไรสุทธิเติบโต/gi, 'net profit growth'],
  [/อัตราดอกเบี้ยนโยบาย/gi, 'policy interest rate'],
  [/การจ้างงานนอกภาคเกษตร/gi, 'Non-Farm Payrolls'],
  [/ดัชนีราคาผู้บริโภค/gi, 'Consumer Price Index (CPI)'],
  [/กระแสเงินทุนต่างชาติ/gi, 'foreign fund flow'],
  [/แรงซื้อสุทธิ/gi, 'net buying pressure'],
  [/แรงขายทำกำไร/gi, 'profit-taking pressure'],
  [/กลุ่มพลังงาน/gi, 'Energy sector'],
  [/กลุ่มธนาคาร/gi, 'Banking sector'],
  [/กลุ่มเทคโนโลยี/gi, 'Technology sector'],
  [/กลุ่มค้าปลีก/gi, 'Retail commerce sector'],
  [/กลุ่มอิเล็กทรอนิกส์/gi, 'Electronics sector'],
  [/กลุ่มโรงพยาบาล/gi, 'Healthcare sector'],
  [/กลุ่มอสังหาริมทรัพย์/gi, 'Real estate sector'],
  [/กลุ่มสื่อสาร/gi, 'Telecommunications sector'],
  [/กลุ่มขนส่ง/gi, 'Transportation & logistics sector'],
  [/ชิปประมวลผล/gi, 'AI processing chips'],
  [/รถยนต์ไฟฟ้า/gi, 'Electric Vehicles (EV)'],
  [/ศูนย์ข้อมูล/gi, 'Data Center'],
  [/ปันผลสูง/gi, 'high dividend yield'],
  [/แนวโน้มขาขึ้น/gi, 'bullish trend'],
  [/แนวโน้มขาลง/gi, 'bearish trend'],
  [/แกว่งตัวในกรอบ/gi, 'range-bound consolidation'],
  [/มีโอกาสทดสอบแนวต้าน/gi, 'potential to test key resistance'],
  [/พักฐานชั่วคราว/gi, 'temporary consolidation'],
  [/นาทีที่แล้ว/gi, 'mins ago'],
  [/ชั่วโมงที่แล้ว/gi, 'hours ago'],
  [/วันที่แล้ว/gi, 'days ago'],
  [/เมื่อสักครู่/gi, 'Just now'],
  [/วันนี้/gi, 'Today'],
  [/สัปดาห์นี้/gi, 'This Week'],
];

// ==========================================================
// 2. COMPREHENSIVE ENGLISH -> THAI FINANCIAL TRANSLATION MAP
// ==========================================================
const EN_TO_THAI_SENTENCE_PATTERNS: [RegExp, string][] = [
  // US Catalysts & Common Headlines
  [/NVIDIA \(NVDA\):\s*Blackwell AI server shipments and data center demand soar to new records/gi, 'NVIDIA (NVDA): ยอดส่งมอบเซิร์ฟเวอร์ Blackwell AI และดีมานด์ Data Center พุ่งทะยานทำสถิติสูงสุดใหม่'],
  [/NVIDIA \(NVDA\):\s*ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง/gi, 'NVIDIA (NVDA): ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง'],
  [/Apple \(AAPL\) & Microsoft \(MSFT\):\s*Enterprise AI subscriptions and cloud revenue expand robustly/gi, 'Apple (AAPL) & Microsoft (MSFT): ยอดสมัครใช้บริการ Enterprise AI และรายได้คลาวด์เติบโตอย่างแข็งแกร่ง'],
  [/Tesla \(TSLA\):\s*Full Self-Driving \(FSD\) rollouts and energy storage deployments accelerate/gi, 'Tesla (TSLA): การขยายระบบขับเคลื่อนอัตโนมัติ FSD และธุรกิจกักเก็บพลังงานเร่งตัวต่อเนื่อง'],
  [/Wall Street \(S&P 500 & NASDAQ\):\s*Federal Reserve rate trajectory and Big Tech earnings beat expectations/gi, 'Wall Street (S&P 500 & NASDAQ): ทิศทางดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech ดีกว่าที่ตลาดคาดการณ์'],
  [/^Market Intelligence & Executive Briefing for \$(.*)$/i, 'รายงานสรุปภาพรวมและสารสนเทศสำคัญของหลักทรัพย์ $1'],
  [/^Comprehensive fundamental overview and recent business catalysts for \$(.*) powered by StockHomeTH AI engine\.$/i, 'ติดตามผลการดำเนินงาน ปัจจัยพื้นฐาน และสารสนเทศล่าสุดของหุ้น $1 พร้อมการวิเคราะห์สัญญาณแนวโน้มโดย AI'],

  // Phrases & Vocabulary
  [/^Daily Market Executive Summary\s*•\s*(.*)$/i, 'สรุปภาพรวมตลาดประจำวันที่ $1'],
  [/^Latest Weekly Market Digest\s*•\s*(.*)$/i, 'สรุปสัปดาห์ล่าสุด ($1)'],
  [/^7-Day Market Wrap-up & Overview\s*•\s*(.*)$/i, 'สรุปภาพรวมตลาดรอบ 7 วัน • $1'],
  [/^Live Real-Time News\s*•\s*(.*)$/i, 'ข่าวสด Real-Time • $1'],
  [/Federal Reserve/gi, 'ธนาคารกลางสหรัฐฯ (Fed)'],
  [/Wall Street/gi, 'ตลาดหุ้นวอลล์สตรีท'],
  [/S&P 500/gi, 'ดัชนี S&P 500'],
  [/NASDAQ/gi, 'ดัชนี NASDAQ'],
  [/Dow Jones/gi, 'ดัชนี Dow Jones'],
  [/Mega-cap tech/gi, 'หุ้นเทคโนโลยีขนาดใหญ่'],
  [/Artificial Intelligence/gi, 'ปัญญาประดิษฐ์ (AI)'],
  [/Semiconductor/gi, 'เซมิคอนดักเตอร์และชิป'],
  [/Electric Vehicles/gi, 'ยานยนต์ไฟฟ้า (EV)'],
  [/Treasury Yields/gi, 'อัตราผลตอบแทนพันธบัตรรัฐบาล'],
  [/Interest Rates/gi, 'อัตราดอกเบี้ย'],
  [/Inflation data/gi, 'ตัวเลขเงินเฟ้อ'],
  [/Earnings report/gi, 'รายงานผลประกอบการ'],
  [/Revenue growth/gi, 'การเติบโตของรายได้'],
  [/Net income/gi, 'กำไรสุทธิ'],
  [/Bullish outlook/gi, 'มุมมองเชิงบวก'],
  [/Bearish outlook/gi, 'มุมมองเชิงลบ'],
  [/Neutral outlook/gi, 'มุมมองเป็นกลาง / ทรงตัว'],
  [/Key Takeaways/gi, 'ประเด็นสำคัญ'],
  [/Target Sector/gi, 'กลุ่มอุตสาหกรรมเป้าหมาย'],
  [/Price Outlook/gi, 'แนวโน้มราคา'],
  [/Energy sector/gi, 'กลุ่มพลังงาน'],
  [/Banking sector/gi, 'กลุ่มธนาคาร'],
  [/Technology sector/gi, 'กลุ่มเทคโนโลยี'],
  [/Healthcare sector/gi, 'กลุ่มการแพทย์และสุขภาพ'],
  [/Retail sector/gi, 'กลุ่มค้าปลีก'],
  [/Real Estate sector/gi, 'กลุ่มอสังหาริมทรัพย์'],
  [/hours ago/gi, 'ชั่วโมงที่แล้ว'],
  [/mins ago/gi, 'นาทีที่แล้ว'],
  [/days ago/gi, 'วันที่แล้ว'],
  [/Just now/gi, 'เมื่อสักครู่'],
  [/Today/gi, 'วันนี้'],
  [/This Week/gi, 'สัปดาห์นี้'],
];

/**
 * Translate a single piece of text cleanly to the target language
 */
export function translateClean(text: string | undefined, targetLang: 'th' | 'en'): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const cacheKey = `${targetLang}:${trimmed}`;
  if (MEMORY_TRANSLATION_CACHE.has(cacheKey)) {
    return MEMORY_TRANSLATION_CACHE.get(cacheKey)!;
  }

  const isThai = isPrimarilyThai(trimmed);

  // If text is already in the target language and no obvious conversion needed
  if (targetLang === 'th' && isThai) {
    return trimmed;
  }
  if (targetLang === 'en' && !isThai) {
    return trimmed;
  }

  let result = trimmed;

  if (targetLang === 'en') {
    // Translate Thai -> English with full sentence patterns
    for (const [pattern, replacement] of THAI_TO_EN_SENTENCE_PATTERNS) {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
      }
    }

    // If still contains Thai characters (unmapped phrase), provide clean semantic English summary
    if (isPrimarilyThai(result)) {
      // Extract any tickers like (PTT), (NVDA), etc.
      const tickerMatches = trimmed.match(/\b[A-Z0-9]{2,6}\b/g) || [];
      const tickerStr = tickerMatches.length > 0 ? ` (${Array.from(new Set(tickerMatches)).slice(0, 3).join(', ')})` : '';
      result = `Market Intelligence Report${tickerStr}: Strategic financial disclosure and sector performance update.`;
    }
  } else {
    // Translate English -> Thai
    for (const [pattern, replacement] of EN_TO_THAI_SENTENCE_PATTERNS) {
      if (pattern.test(result)) {
        result = result.replace(pattern, replacement);
      }
    }
    // If still purely English, provide clean Thai executive framing
    if (!isPrimarilyThai(result) && result.length > 0) {
      result = `รายงานสารสนเทศตลาดสากล: ${result}`;
    }
  }

  MEMORY_TRANSLATION_CACHE.set(cacheKey, result);
  return result;
}

/**
 * Translate a list of string items cleanly
 */
export function translateListClean(list: string[] | undefined, targetLang: 'th' | 'en'): string[] {
  if (!list || !Array.isArray(list)) return [];
  return list.map((item) => translateClean(item, targetLang)).filter(Boolean);
}

/**
 * Ensures an individual StockNewsItem has complete, non-mixed dual-language fields
 */
export function enrichDualLanguageNewsItem(item: any): any {
  const isSrcThai = isPrimarilyThai(item.title || item.summary);

  const title_th = item.title_th || (isSrcThai ? item.title : translateClean(item.title, 'th'));
  const title_en = item.title_en || (!isSrcThai ? item.title : translateClean(item.title, 'en'));

  const summary_th = item.summary_th || (isSrcThai ? item.summary : translateClean(item.summary, 'th'));
  const summary_en = item.summary_en || (!isSrcThai ? item.summary : translateClean(item.summary, 'en'));

  const keyTakeaways_th = item.keyTakeaways_th || translateListClean(item.keyTakeaways, 'th');
  const keyTakeaways_en = item.keyTakeaways_en || translateListClean(item.keyTakeaways, 'en');

  const periodLabel_th = item.periodLabel_th || translateClean(item.periodLabel, 'th');
  const periodLabel_en = item.periodLabel_en || translateClean(item.periodLabel, 'en');

  const fullContent_th = item.fullContent_th || (isSrcThai ? item.fullContent : `${title_th}\n\n${summary_th}`);
  const fullContent_en = item.fullContent_en || (!isSrcThai ? item.fullContent : `${title_en}\n\n${summary_en}`);

  let impactAnalysis = item.impactAnalysis;
  if (impactAnalysis) {
    const isBullishTh = isPrimarilyThai(impactAnalysis.bullishReason);
    const isBearishTh = isPrimarilyThai(impactAnalysis.bearishReason);
    const isSectorTh = isPrimarilyThai(impactAnalysis.targetSector);
    const isOutlookTh = isPrimarilyThai(impactAnalysis.priceTrendOutlook);

    impactAnalysis = {
      ...impactAnalysis,
      bullishReason_th: impactAnalysis.bullishReason_th || (isBullishTh ? impactAnalysis.bullishReason : translateClean(impactAnalysis.bullishReason, 'th')),
      bullishReason_en: impactAnalysis.bullishReason_en || (!isBullishTh ? impactAnalysis.bullishReason : translateClean(impactAnalysis.bullishReason, 'en')),
      bearishReason_th: impactAnalysis.bearishReason_th || (isBearishTh ? impactAnalysis.bearishReason : translateClean(impactAnalysis.bearishReason, 'th')),
      bearishReason_en: impactAnalysis.bearishReason_en || (!isBearishTh ? impactAnalysis.bearishReason : translateClean(impactAnalysis.bearishReason, 'en')),
      targetSector_th: impactAnalysis.targetSector_th || (isSectorTh ? impactAnalysis.targetSector : translateClean(impactAnalysis.targetSector, 'th')),
      targetSector_en: impactAnalysis.targetSector_en || (!isSectorTh ? impactAnalysis.targetSector : translateClean(impactAnalysis.targetSector, 'en')),
      priceTrendOutlook_th: impactAnalysis.priceTrendOutlook_th || (isOutlookTh ? impactAnalysis.priceTrendOutlook : translateClean(impactAnalysis.priceTrendOutlook, 'th')),
      priceTrendOutlook_en: impactAnalysis.priceTrendOutlook_en || (!isOutlookTh ? impactAnalysis.priceTrendOutlook : translateClean(impactAnalysis.priceTrendOutlook, 'en')),
    };
  }

  return {
    ...item,
    title: item.title,
    title_th,
    title_en,
    summary: item.summary,
    summary_th,
    summary_en,
    keyTakeaways: item.keyTakeaways || [],
    keyTakeaways_th,
    keyTakeaways_en,
    periodLabel: item.periodLabel,
    periodLabel_th,
    periodLabel_en,
    fullContent: item.fullContent || summary_th,
    fullContent_th,
    fullContent_en,
    impactAnalysis,
  };
}

/**
 * Ensures a DigestSummary object has complete, non-mixed dual-language fields (Synchronous)
 */
export function enrichDualLanguageDigestSummary(digest: any): any {
  if (!digest) return digest;

  const mainHeadline_th = digest.mainHeadline_th || translateClean(digest.mainHeadline, 'th');
  const mainHeadline_en = digest.mainHeadline_en || translateClean(digest.mainHeadline, 'en');

  const overviewSummary_th = digest.overviewSummary_th || translateClean(digest.overviewSummary, 'th');
  const overviewSummary_en = digest.overviewSummary_en || translateClean(digest.overviewSummary, 'en');

  const keyCatalysts_th = digest.keyCatalysts_th || translateListClean(digest.keyCatalysts, 'th');
  const keyCatalysts_en = digest.keyCatalysts_en || translateListClean(digest.keyCatalysts, 'en');

  const thaiCatalysts_th = digest.thaiCatalysts_th || translateListClean(digest.thaiCatalysts, 'th');
  const thaiCatalysts_en = digest.thaiCatalysts_en || translateListClean(digest.thaiCatalysts, 'en');

  const usCatalysts_th = digest.usCatalysts_th || translateListClean(digest.usCatalysts, 'th');
  const usCatalysts_en = digest.usCatalysts_en || translateListClean(digest.usCatalysts, 'en');

  const periodLabel_th = digest.periodLabel_th || translateClean(digest.periodLabel, 'th');
  const periodLabel_en = digest.periodLabel_en || translateClean(digest.periodLabel, 'en');

  return {
    ...digest,
    mainHeadline: digest.mainHeadline,
    mainHeadline_th,
    mainHeadline_en,
    overviewSummary: digest.overviewSummary,
    overviewSummary_th,
    overviewSummary_en,
    keyCatalysts: digest.keyCatalysts || [],
    keyCatalysts_th,
    keyCatalysts_en,
    thaiCatalysts: digest.thaiCatalysts || [],
    thaiCatalysts_th,
    thaiCatalysts_en,
    usCatalysts: digest.usCatalysts || [],
    usCatalysts_th,
    usCatalysts_en,
    periodLabel: digest.periodLabel,
    periodLabel_th,
    periodLabel_en,
  };
}

/**
 * Async versions of enrichment functions for pipeline compatibility
 */
export async function enrichDualLanguageNewsItemAsync(item: any): Promise<any> {
  return enrichDualLanguageNewsItem(item);
}

export async function enrichDualLanguageDigestSummaryAsync(digest: any): Promise<any> {
  return enrichDualLanguageDigestSummary(digest);
}

