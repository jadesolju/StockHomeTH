import type { StockNewsItem, DailyWeeklyDigestSummary } from '../types/stockNews';
import { enrichDualLanguageDigestSummary, enrichDualLanguageNewsItem } from '../lib/utils/newsTranslationEngine';

function getCurrentDateDetails() {
  const now = new Date();
  const dateShort = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateFull = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const dateShortEn = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateFullEn = now.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  const timeStrEn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const isoDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  return { now, dateShort, dateFull, dateShortEn, dateFullEn, timeStr, timeStrEn, isoDate };
}

export function getDynamicDailyDigestSummary(): DailyWeeklyDigestSummary {
  const { dateFull, dateShort, dateFullEn, dateShortEn, timeStr, timeStrEn, isoDate } = getCurrentDateDetails();
  const raw = {
    id: `digest-daily-${isoDate}`,
    periodLabel: `สรุปภาพรวมตลาดประจำวันที่ ${dateFull}`,
    periodLabel_th: `สรุปภาพรวมตลาดประจำวันที่ ${dateFull}`,
    periodLabel_en: `Daily Market Executive Summary • ${dateFullEn}`,
    timeframe: 'daily' as const,
    region: 'all' as const,
    mainHeadline: 'SET Index และตลาดหุ้นโลกเคลื่อนไหวคึกคัก รับกระแสเงินลงทุน AI และทิศทางดอกเบี้ยโลก',
    mainHeadline_th: 'SET Index และตลาดหุ้นโลกเคลื่อนไหวคึกคัก รับกระแสเงินลงทุน AI และทิศทางดอกเบี้ยโลก',
    mainHeadline_en: 'SET Index and Global Equities Rally on Robust AI Capital Inflows & Global Interest Rate Easing',
    overviewSummary: 'ตลาดหุ้นไทยและตลาดสากลตอบรับเชิงบวกต่อภาพรวมเศรษฐกิจและเม็ดเงินลงทุนในอุตสาหกรรมเทคโนโลยี AI โดยมีแรงซื้อกระจายตัวในกลุ่มพลังงาน ธนาคาร และอิเล็กทรอนิกส์ชั้นนำ พร้อมระบบวิเคราะห์ข้อมูลราคาแบบ Real-time ตลอดวัน',
    overviewSummary_th: 'ตลาดหุ้นไทยและตลาดสากลตอบรับเชิงบวกต่อภาพรวมเศรษฐกิจและเม็ดเงินลงทุนในอุตสาหกรรมเทคโนโลยี AI โดยมีแรงซื้อกระจายตัวในกลุ่มพลังงาน ธนาคาร และอิเล็กทรอนิกส์ชั้นนำ พร้อมระบบวิเคราะห์ข้อมูลราคาแบบ Real-time ตลอดวัน',
    overviewSummary_en: 'Thai and international equities advanced on positive macroeconomic indicators and massive capital commitments to the AI technology sector, with broad-based buying in energy heavyweights, banking, and leading semiconductor suppliers.',
    marketSentimentScore: {
      bullishPercent: 68,
      neutralPercent: 22,
      bearishPercent: 10
    },
    keyCatalysts: [
      'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
      'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, NVDA, AAPL)',
      'รายงานงบประมาณและผลประกอบการบริษัทจดทะเบียนส่งสัญญาณเติบโต (CPALL, KBANK, MSFT)'
    ],
    keyCatalysts_th: [
      'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
      'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, NVDA, AAPL)',
      'รายงานงบประมาณและผลประกอบการบริษัทจดทะเบียนส่งสัญญาณเติบโต (CPALL, KBANK, MSFT)'
    ],
    keyCatalysts_en: [
      'Global crude oil and renewable energy stabilization supported energy heavyweights (PTT, GULF, PTTEP)',
      'Surging export demand and AI component orders fueled semiconductor & electronics leaders (DELTA, NVDA, AAPL)',
      'Corporate earnings releases and fiscal expenditure execution signaled sustainable expansion (CPALL, KBANK, MSFT)'
    ],
    thaiCatalysts: [
      'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
      'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, HANA, KCE)',
      'กำลังซื้อในประเทศและการฟื้นตัวของภาคท่องเที่ยวหนุนกลุ่มพาณิชย์ (CPALL, BDMS, AOT)',
      'เม็ดเงินลงทุนสถาบันและ Fund Flow เข้าซื้อสะสมในกลุ่มหุ้น Big Cap SET50'
    ],
    thaiCatalysts_th: [
      'ราคาน้ำมันดิบโลกและพลังงานทางเลือกรักษาเสถียรภาพ หนุนหุ้นกลุ่มพลังงาน (PTT, GULF, PTTEP)',
      'ยอดส่งออกและออเดอร์ชิ้นส่วนอิเล็กทรอนิกส์ AI ขยายตัวต่อเนื่อง (DELTA, HANA, KCE)',
      'กำลังซื้อในประเทศและการฟื้นตัวของภาคท่องเที่ยวหนุนกลุ่มพาณิชย์ (CPALL, BDMS, AOT)',
      'เม็ดเงินลงทุนสถาบันและ Fund Flow เข้าซื้อสะสมในกลุ่มหุ้น Big Cap SET50'
    ],
    thaiCatalysts_en: [
      'Global crude oil and renewable energy stabilization supported energy heavyweights (PTT, GULF, PTTEP)',
      'Surging export demand and AI component orders fueled semiconductor & electronics leaders (DELTA, HANA, KCE)',
      'Domestic consumer spending resilience and tourism recovery boosted retail and healthcare giants (CPALL, BDMS, AOT)',
      'Institutional fund flows continued substantial accumulation in SET50 index benchmark constituents'
    ],
    usCatalysts: [
      'NVIDIA (NVDA): ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง',
      'Apple (AAPL) & Microsoft (MSFT): ยอดสมาชิกและบริการ Cloud AI สหรัฐฯ ขยายตัวแข็งแกร่ง',
      'Tesla (TSLA): ความคืบหน้าการพัฒนาซอฟต์แวร์ Autonomous Driving และยอดส่งมอบรถ EV ทั่วโลก',
      'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech สหรัฐฯ'
    ],
    usCatalysts_th: [
      'NVIDIA (NVDA): ออเดอร์ชิปประมวลผล Blackwell AI และ Data Center ระดับโลกโตแกร่ง',
      'Apple (AAPL) & Microsoft (MSFT): ยอดสมาชิกและบริการ Cloud AI สหรัฐฯ ขยายตัวแข็งแกร่ง',
      'Tesla (TSLA): ความคืบหน้าการพัฒนาซอฟต์แวร์ Autonomous Driving และยอดส่งมอบรถ EV ทั่วโลก',
      'Wall Street (S&P 500 & NASDAQ): ทิศทางนโยบายดอกเบี้ย Fed และผลประกอบการกลุ่ม Big Tech สหรัฐฯ'
    ],
    usCatalysts_en: [
      'NVIDIA (NVDA): Blackwell AI server compute shipments and hyperscale demand hit fresh records',
      'Apple (AAPL) & Microsoft (MSFT): Enterprise AI subscriptions and cloud computing revenues expanded robustly',
      'Tesla (TSLA): Full Self-Driving (FSD) rollout milestones and energy storage deployments accelerated',
      'Wall Street (S&P 500 & NASDAQ): Federal Reserve easing expectations and resilient Big Tech earnings lifted equities'
    ],
    topWatchlistTickers: ['PTT', 'DELTA', 'CPALL', 'NVDA', 'AAPL'],
    updatedAt: `${dateShort} | ${timeStr}`
  };
  return enrichDualLanguageDigestSummary(raw) as DailyWeeklyDigestSummary;
}

export function getDynamicWeeklyDigestSummary(): DailyWeeklyDigestSummary {
  const { dateFull, dateShort, dateFullEn, dateShortEn, timeStr, timeStrEn, isoDate } = getCurrentDateDetails();
  const raw = {
    id: `digest-weekly-${isoDate}`,
    periodLabel: `สรุปสัปดาห์ล่าสุด (${dateShort})`,
    periodLabel_th: `สรุปสัปดาห์ล่าสุด (${dateShort})`,
    periodLabel_en: `Latest Weekly Market Digest (${dateShortEn})`,
    timeframe: 'weekly' as const,
    region: 'all' as const,
    mainHeadline: 'สรุปสัปดาห์: สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง',
    mainHeadline_th: 'สรุปสัปดาห์: สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง',
    mainHeadline_en: 'Weekly Wrap: Robust Global Capital Inflows Fuel Asian Equities & US Tech Leaders',
    overviewSummary: 'ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ ส่งผลให้เกิดแรงซื้อสุทธิสะสมในหุ้น Big Cap และกลุ่มเทคโนโลยีระดับโลกอย่างต่อเนื่อง',
    overviewSummary_th: 'ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ ส่งผลให้เกิดแรงซื้อสุทธิสะสมในหุ้น Big Cap และกลุ่มเทคโนโลยีระดับโลกอย่างต่อเนื่อง',
    overviewSummary_en: 'Throughout the past week, global equity markets responded favorably to resilient liquidity and robust earnings from leading corporations, driving sustained net accumulation in large caps and mega-cap tech.',
    marketSentimentScore: {
      bullishPercent: 75,
      neutralPercent: 18,
      bearishPercent: 7
    },
    keyCatalysts: [
      'สัญญาณการปรับโครงสร้างอัตราดอกเบี้ยและนโยบายการเงินทั่วโลกเอื้อต่อสินทรัพย์เติบโต',
      'นักลงทุนสถาบันและต่างชาติเข้าซื้อสุทธิต่อเนื่องในกลุ่มหุ้น SET50 & S&P500',
      'การลงทุนโครงสร้างพื้นฐานด้าน Data Center และ AI Hub ขยายตัวทั่วภูมิภาค'
    ],
    keyCatalysts_th: [
      'สัญญาณการปรับโครงสร้างอัตราดอกเบี้ยและนโยบายการเงินทั่วโลกเอื้อต่อสินทรัพย์เติบโต',
      'นักลงทุนสถาบันและต่างชาติเข้าซื้อสุทธิต่อเนื่องในกลุ่มหุ้น SET50 & S&P500',
      'การลงทุนโครงสร้างพื้นฐานด้าน Data Center และ AI Hub ขยายตัวทั่วภูมิภาค'
    ],
    keyCatalysts_en: [
      'Global central bank monetary easing signals created favorable tailwinds for growth assets',
      'Sustained net purchases by institutional and international investors lifted SET50 & S&P 500 equities',
      'Hyperscale Data Center and regional AI ecosystem investments accelerated significantly'
    ],
    thaiCatalysts: [
      'สัญญาณ Fund Flow ไหลเข้าสะสมในหุ้นขนาดใหญ่ SET50 และหุ้นปันผลสูง (PTT, KBANK, ADVANC)',
      'การลงทุนโครงสร้างพื้นฐาน Data Center และศูนย์กลาง AI ในประเทศไทยขยายตัวต่อเนื่อง (DELTA, GULF)',
      'ตัวเลขเศรษฐกิจภาคบริการและการท่องเที่ยวไทยขยายตัวดีกว่าคาดการณ์ (AOT, CPALL, BDMS)'
    ],
    thaiCatalysts_th: [
      'สัญญาณ Fund Flow ไหลเข้าสะสมในหุ้นขนาดใหญ่ SET50 และหุ้นปันผลสูง (PTT, KBANK, ADVANC)',
      'การลงทุนโครงสร้างพื้นฐาน Data Center และศูนย์กลาง AI ในประเทศไทยขยายตัวต่อเนื่อง (DELTA, GULF)',
      'ตัวเลขเศรษฐกิจภาคบริการและการท่องเที่ยวไทยขยายตัวดีกว่าคาดการณ์ (AOT, CPALL, BDMS)'
    ],
    thaiCatalysts_en: [
      'Foreign & institutional capital actively accumulated SET50 large caps and dividend blue-chips (PTT, KBANK, ADVANC)',
      'Rapid expansion in data center and national AI hub infrastructure investments bolstered (DELTA, GULF)',
      'Hospitality, medical tourism, and service sector economic indicators beat consensus estimates (AOT, CPALL, BDMS)'
    ],
    usCatalysts: [
      'NVIDIA (NVDA) & พันธมิตร Semiconductor: แรงขับเคลื่อนการลงทุนโครงสร้างพื้นฐาน AI โลกทำสถิติใหม่',
      'ดัชนี S&P 500 และ NASDAQ: ตลาดหุ้น Wall Street ได้รับแรงหนุนจากผลประกอบการ Big Tech ที่แข็งแกร่ง',
      'Tesla (TSLA) & Clean Energy: การขยายกำลังผลิตแบตเตอรี่และระบบ AI ขับเคลื่อนอัตโนมัติเต็มรูปแบบ'
    ],
    usCatalysts_th: [
      'NVIDIA (NVDA) & พันธมิตร Semiconductor: แรงขับเคลื่อนการลงทุนโครงสร้างพื้นฐาน AI โลกทำสถิติใหม่',
      'ดัชนี S&P 500 และ NASDAQ: ตลาดหุ้น Wall Street ได้รับแรงหนุนจากผลประกอบการ Big Tech ที่แข็งแกร่ง',
      'Tesla (TSLA) & Clean Energy: การขยายกำลังผลิตแบตเตอรี่และระบบ AI ขับเคลื่อนอัตโนมัติเต็มรูปแบบ'
    ],
    usCatalysts_en: [
      'NVIDIA (NVDA) & Semiconductor Partners: Global AI compute infrastructure investments soared to all-time highs',
      'S&P 500 & NASDAQ: Wall Street rallied on blockbuster Big Tech earnings and constructive macro backdrop',
      'Tesla (TSLA) & Clean Energy: Megapack battery production scale and full autonomous AI system developments accelerated'
    ],
    topWatchlistTickers: ['ADVANC', 'BDMS', 'KBANK', 'TSLA', 'MSFT'],
    updatedAt: `${dateShort} | ${timeStr}`
  };
  return enrichDualLanguageDigestSummary(raw) as DailyWeeklyDigestSummary;
}

export function getDynamicMockNewsItems(): StockNewsItem[] {
  const { dateShort, dateShortEn, timeStr } = getCurrentDateDetails();
  const items: any[] = [
    // --- DAILY THAI NEWS 1 ---
    {
      id: 'news-d1',
      title: 'SET Index ขยับบวกสดใส แรงซื้อ PTT-DELTA หนุนตลาดรับทิศทางความเชื่อมั่นการลงทุน',
      title_th: 'SET Index ขยับบวกสดใส แรงซื้อ PTT-DELTA หนุนตลาดรับทิศทางความเชื่อมั่นการลงทุน',
      title_en: 'SET Index Climbs on Strong Buying in PTT & DELTA as Market Sentiment Improves',
      summary: 'ดัชนีตลาดหุ้นไทยปรับตัวในแดนบวก หนุนด้วยแรงซื้อกลุ่มพลังงานและกลุ่มเทคโนโลยี ขานรับทิศทางตลาดโลกและแรงซื้อของนักลงทุนสถาบัน',
      summary_th: 'ดัชนีตลาดหุ้นไทยปรับตัวในแดนบวก หนุนด้วยแรงซื้อกลุ่มพลังงานและกลุ่มเทคโนโลยี ขานรับทิศทางตลาดโลกและแรงซื้อของนักลงทุนสถาบัน',
      summary_en: 'Thai equities advanced in positive territory, propelled by energy and technology leaders following global momentum and institutional fund inflows.',
      keyTakeaways: [
        'SET Index เคลื่อนไหวในทิศทางบวก ดัชนีตอบรับปัจจัยพื้นฐานและเม็ดเงินลงทุนใหม่',
        'หุ้น PTT และกลุ่มพลังงานฟื้นตัวเด่น รับอุปสงค์พลังงานและทิศทางราคาน้ำมันทรงตัวสูง',
        'DELTA และชิ้นส่วนอิเล็กทรอนิกส์ได้แรงหนุนจากออเดอร์ระบบประมวลผล AI',
        'สัดส่วนการซื้อขายคึกคัก สะท้อนความเชื่อมั่นของนักลงทุนในประเทศและต่างชาติ'
      ],
      keyTakeaways_th: [
        'SET Index เคลื่อนไหวในทิศทางบวก ดัชนีตอบรับปัจจัยพื้นฐานและเม็ดเงินลงทุนใหม่',
        'หุ้น PTT และกลุ่มพลังงานฟื้นตัวเด่น รับอุปสงค์พลังงานและทิศทางราคาน้ำมันทรงตัวสูง',
        'DELTA และชิ้นส่วนอิเล็กทรอนิกส์ได้แรงหนุนจากออเดอร์ระบบประมวลผล AI',
        'สัดส่วนการซื้อขายคึกคัก สะท้อนความเชื่อมั่นของนักลงทุนในประเทศและต่างชาติ'
      ],
      keyTakeaways_en: [
        'SET Index traded higher, driven by solid fundamentals and fresh capital allocations.',
        'PTT and energy peers gained on resilient energy demand and elevated benchmark oil prices.',
        'DELTA electronics surged on rising global orders for AI computing infrastructure.',
        'Robust trading volume reflected growing confidence among domestic and foreign investors.'
      ],
      fullContent: `ดัชนีตลาดหลักทรัพย์แห่งประเทศไทย (SET Index) ปรับตัวเพิ่มขึ้นอย่างต่อเนื่อง โดยมีมูลค่าการซื้อขายหนาแน่น บรรยากาศการลงทุนเป็นไปอย่างคึกคัก ขับเคลื่อนด้วยหุ้นกลุ่มพลังงานขนาดใหญ่และกลุ่มเทคโนโลยี\n\nนอกจากนี้ หุ้นกลุ่มชิ้นส่วนอิเล็กทรอนิกส์อย่าง DELTA ปรับตัวขึ้นตอบรับกระแสการลงทุนในศูนย์ข้อมูล (Data Center) และโครงสร้างพื้นฐาน AI ในภูมิภาคที่มีอัตราเติบโตสูงต่อเนื่อง`,
      fullContent_th: `ดัชนีตลาดหลักทรัพย์แห่งประเทศไทย (SET Index) ปรับตัวเพิ่มขึ้นอย่างต่อเนื่อง โดยมีมูลค่าการซื้อขายหนาแน่น บรรยากาศการลงทุนเป็นไปอย่างคึกคัก ขับเคลื่อนด้วยหุ้นกลุ่มพลังงานขนาดใหญ่และกลุ่มเทคโนโลยี\n\nนอกจากนี้ หุ้นกลุ่มชิ้นส่วนอิเล็กทรอนิกส์อย่าง DELTA ปรับตัวขึ้นตอบรับกระแสการลงทุนในศูนย์ข้อมูล (Data Center) และโครงสร้างพื้นฐาน AI ในภูมิภาคที่มีอัตราเติบโตสูงต่อเนื่อง`,
      fullContent_en: `The Stock Exchange of Thailand (SET Index) continued its positive momentum with robust trading turnover. Market sentiment remained upbeat, led by heavyweights in the energy and technology sectors.\n\nElectronics manufacturers such as DELTA advanced on rapid investments in hyperscale Data Centers and regional AI infrastructure.`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET Index',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      periodLabel_th: `สรุปรายวัน • ${dateShort}`,
      periodLabel_en: `Daily Digest • ${dateShortEn}`,
      sentiment: 'bullish',
      tickers: ['PTT', 'DELTA', 'PTTEP'],
      readTime: '2 นาที',
      source: 'สำนักข่าวการเงินไทย (SET)',
      category: 'macro',
      isFeatured: true,
      link: 'https://www.settrade.com',
      url: 'https://www.settrade.com',
      sourceUrl: 'https://www.settrade.com',
      impactAnalysis: {
        bullishReason: 'ทิศทางเศรษฐกิจฟื้นตัว + เงินทุนไหลเข้าหุ้น Big Cap',
        bullishReason_th: 'ทิศทางเศรษฐกิจฟื้นตัว + เงินทุนไหลเข้าหุ้น Big Cap',
        bullishReason_en: 'Macroeconomic recovery and persistent fund flows into large-cap constituents',
        targetSector: 'พลังงาน & เทคโนโลยี',
        targetSector_th: 'พลังงาน & เทคโนโลยี',
        targetSector_en: 'Energy & Technology',
        priceTrendOutlook: 'คาดการณ์แนวโน้มระยะสั้นทดสอบแนวต้านสำคัญต่อเนื่อง',
        priceTrendOutlook_th: 'คาดการณ์แนวโน้มระยะสั้นทดสอบแนวต้านสำคัญต่อเนื่อง',
        priceTrendOutlook_en: 'Short-term outlook indicates testing key resistance levels with positive momentum'
      }
    },

    // --- DAILY THAI NEWS 2 ---
    {
      id: 'news-d2',
      title: 'CPALL ยอดขายสาขาเดิม (SSSG) โตแกร่ง รับอานิสงส์บริโภคในประเทศและนักท่องเที่ยว',
      title_th: 'CPALL ยอดขายสาขาเดิม (SSSG) โตแกร่ง รับอานิสงส์บริโภคในประเทศและนักท่องเที่ยว',
      title_en: 'CPALL Delivers Strong Same-Store Sales Growth Driven by Domestic Spending & Tourism',
      summary: 'ซีพี ออลล์ เผยยอดขายร้าน 7-Eleven ขยายตัวดีจากกลุ่มอาหารพร้อมทาน เครื่องดื่ม และการใช้จ่ายของนักท่องเที่ยว',
      summary_th: 'ซีพี ออลล์ เผยยอดขายร้าน 7-Eleven ขยายตัวดีจากกลุ่มอาหารพร้อมทาน เครื่องดื่ม และการใช้จ่ายของนักท่องเที่ยว',
      summary_en: 'CP ALL Public Company Limited reports solid revenue growth across 7-Eleven branches, powered by ready-to-eat meals, beverages, and tourist expenditures.',
      keyTakeaways: [
        'SSSG ขยายตัวต่อเนื่อง โดดเด่นในสาขาจังหวัดท่องเที่ยวหลักและชุมชนเมือง',
        'รายได้จากกลุ่มอาหารพร้อมทานและเครื่องดื่ม All Café เติบโตสองหลัก',
        'แผนขยายสาขาใหม่ทั่วประเทศคืบหน้าตามเป้าหมาย'
      ],
      keyTakeaways_th: [
        'SSSG ขยายตัวต่อเนื่อง โดดเด่นในสาขาจังหวัดท่องเที่ยวหลักและชุมชนเมือง',
        'รายได้จากกลุ่มอาหารพร้อมทานและเครื่องดื่ม All Café เติบโตสองหลัก',
        'แผนขยายสาขาใหม่ทั่วประเทศคืบหน้าตามเป้าหมาย'
      ],
      keyTakeaways_en: [
        'Same-Store Sales Growth expanded steadily, particularly in key tourism provinces and urban hubs.',
        'Revenue from ready-to-eat meals and All Café beverage categories posted double-digit growth.',
        'New store expansion nationwide progressed right on schedule.'
      ],
      fullContent: `บริษัท ซีพี ออลล์ จำกัด (มหาชน) หรือ CPALL แถลงยอดขายจากสาขาเดิม (Same Store Sales Growth: SSSG) เติบโตต่อเนื่อง ปัจจัยขับเคลื่อนหลักมาจากกำลังซื้อในประเทศและจำนวนนักท่องเที่ยวที่เพิ่มขึ้น ส่งผลให้ยอดซื้อต่อบิลปรับตัวสูงขึ้น`,
      fullContent_th: `บริษัท ซีพี ออลล์ จำกัด (มหาชน) หรือ CPALL แถลงยอดขายจากสาขาเดิม (Same Store Sales Growth: SSSG) เติบโตต่อเนื่อง ปัจจัยขับเคลื่อนหลักมาจากกำลังซื้อในประเทศและจำนวนนักท่องเที่ยวที่เพิ่มขึ้น ส่งผลให้ยอดซื้อต่อบิลปรับตัวสูงขึ้น`,
      fullContent_en: `CP ALL Public Company Limited (CPALL) announced steady Same Store Sales Growth (SSSG), primarily fueled by domestic purchasing power and foreign tourist arrivals resulting in higher average ticket spend.`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET50',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      periodLabel_th: `สรุปรายวัน • ${dateShort}`,
      periodLabel_en: `Daily Digest • ${dateShortEn}`,
      sentiment: 'bullish',
      tickers: ['CPALL', 'CPAXT'],
      readTime: '3 นาที',
      source: 'ข่าวหุ้นอินไซด์ (Kaohoon)',
      category: 'retail',
      link: 'https://www.kaohoon.com',
      url: 'https://www.kaohoon.com',
      sourceUrl: 'https://www.kaohoon.com',
      impactAnalysis: {
        bullishReason: 'ยอดขายสาขาเดิมขยายตัวแข็งแกร่ง อัตรากำไรขั้นต้นปรับตัวดีขึ้น',
        bullishReason_th: 'ยอดขายสาขาเดิมขยายตัวแข็งแกร่ง อัตรากำไรขั้นต้นปรับตัวดีขึ้น',
        bullishReason_en: 'Robust same-store sales expansion and improving gross margins',
        targetSector: 'พาณิชย์ & ค้าปลีก',
        targetSector_th: 'พาณิชย์ & ค้าปลีก',
        targetSector_en: 'Commerce & Retail',
        priceTrendOutlook: 'ลุ้นทดสอบราคาเป้าหมายตามกรอบสะสม',
        priceTrendOutlook_th: 'ลุ้นทดสอบราคาเป้าหมายตามกรอบสะสม',
        priceTrendOutlook_en: 'Positive trajectory towards analyst target valuation within the accumulation zone'
      }
    },

    // --- DAILY THAI NEWS 3 ---
    {
      id: 'news-d3',
      title: 'BDMS ประกาศงบลงทุนขยายศูนย์การแพทย์เฉพาะทางรองรับ Medical Tourism',
      title_th: 'BDMS ประกาศงบลงทุนขยายศูนย์การแพทย์เฉพาะทางรองรับ Medical Tourism',
      title_en: 'BDMS Expands Specialized Centers of Excellence to Capture Medical Tourism Growth',
      summary: 'กรุงเทพดุสิตเวชการ รุกยกระดับความเป็นเลิศทางการแพทย์ เปิดศูนย์การรักษาโรคซับซ้อนใหม่ รักษาสัดส่วนผู้ป่วยต่างชาติสูง',
      summary_th: 'กรุงเทพดุสิตเวชการ รุกยกระดับความเป็นเลิศทางการแพทย์ เปิดศูนย์การรักษาโรคซับซ้อนใหม่ รักษาสัดส่วนผู้ป่วยต่างชาติสูง',
      summary_en: 'Bangkok Dusit Medical Services boosts CAPEX for high-acuity tertiary care centers, maintaining a high share of international patients.',
      keyTakeaways: [
        'งบลงทุนมุ่งเน้นศูนย์ความเป็นเลิศด้านมะเร็ง หัวใจ และสมอง',
        'รายได้จากผู้ป่วยต่างชาติคิดเป็นสัดส่วนสำคัญ เติบโตจากตะวันออกกลางและอาเซียน',
        'คาดหนุนการเติบโตของรายได้ระยะยาวอย่างมั่นคง'
      ],
      keyTakeaways_th: [
        'งบลงทุนมุ่งเน้นศูนย์ความเป็นเลิศด้านมะเร็ง หัวใจ และสมอง',
        'รายได้จากผู้ป่วยต่างชาติคิดเป็นสัดส่วนสำคัญ เติบโตจากตะวันออกกลางและอาเซียน',
        'คาดหนุนการเติบโตของรายได้ระยะยาวอย่างมั่นคง'
      ],
      keyTakeaways_en: [
        'Capital expenditure focuses on Centers of Excellence in Oncology, Cardiology, and Neurology.',
        'International patient revenue represents a significant share, with strong growth from the Middle East and ASEAN.',
        'Positioned to drive resilient long-term revenue growth.'
      ],
      fullContent: `บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน) หรือ BDMS เปิดเผยแผนยุทธศาสตร์มุ่งเน้นการขยายขีดความสามารถการรักษาโรคซับซ้อนระดับสูง (Tertiary Care) เพื่อรองรับความต้องการที่เพิ่มขึ้นของผู้ป่วยทั้งในและต่างประเทศ`,
      fullContent_th: `บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน) หรือ BDMS เปิดเผยแผนยุทธศาสตร์มุ่งเน้นการขยายขีดความสามารถการรักษาโรคซับซ้อนระดับสูง (Tertiary Care) เพื่อรองรับความต้องการที่เพิ่มขึ้นของผู้ป่วยทั้งในและต่างประเทศ`,
      fullContent_en: `Bangkok Dusit Medical Services PLC (BDMS) unveiled strategic initiatives to expand advanced tertiary care capabilities, meeting surging healthcare demand from both domestic and foreign patients.`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET50',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      periodLabel_th: `สรุปรายวัน • ${dateShort}`,
      periodLabel_en: `Daily Digest • ${dateShortEn}`,
      sentiment: 'neutral',
      tickers: ['BDMS', 'BH'],
      readTime: '2 นาที',
      source: 'Money Channel Thailand',
      category: 'health',
      link: 'https://www.set.or.th',
      url: 'https://www.set.or.th',
      sourceUrl: 'https://www.set.or.th',
      impactAnalysis: {
        bullishReason: 'เติบโตยั่งยืนจากเทรนด์สังคมสูงวัยและผู้ป่วยต่างชาติ',
        bullishReason_th: 'เติบโตยั่งยืนจากเทรนด์สังคมสูงวัยและผู้ป่วยต่างชาติ',
        bullishReason_en: 'Sustainable structural growth driven by aging demographics and medical tourists',
        bearishReason: 'ใช้เงินลงทุนสูงในระยะสั้น อาจกดดันผลตอบแทนชั่วคราว',
        bearishReason_th: 'ใช้เงินลงทุนสูงในระยะสั้น อาจกดดันผลตอบแทนชั่วคราว',
        bearishReason_en: 'High upfront CAPEX may cause temporary pressure on short-term returns',
        targetSector: 'การแพทย์ & โรงพยาบาล',
        targetSector_th: 'การแพทย์ & โรงพยาบาล',
        targetSector_en: 'Healthcare & Hospitals',
        priceTrendOutlook: 'แกว่งตัวในกรอบสะสมเพื่อการลงทุนระยะยาว',
        priceTrendOutlook_th: 'แกว่งตัวในกรอบสะสมเพื่อการลงทุนระยะยาว',
        priceTrendOutlook_en: 'Range-bound consolidation suitable for long-term defensive accumulation'
      }
    },

    // --- DAILY GLOBAL NEWS 1 ---
    {
      id: 'news-d4',
      title: 'NVIDIA เดินหน้าขยายไลน์ชิป AI รุ่นใหม่ จับมือพันธมิตรคลาวด์ระดับโลก',
      title_th: 'NVIDIA เดินหน้าขยายไลน์ชิป AI รุ่นใหม่ จับมือพันธมิตรคลาวด์ระดับโลก',
      title_en: 'NVIDIA Expands Next-Gen AI Chip Roadmap in Collaboration with Hyperscale Cloud Giants',
      summary: 'หุ้น NVDA นำทัพหุ้นกลุ่มเทคโนโลยีสหรัฐฯ ปิดบวก ขานรับออเดอร์ชิปประมวลผล AI จาก Microsoft, Google และ Meta',
      summary_th: 'หุ้น NVDA นำทัพหุ้นกลุ่มเทคโนโลยีสหรัฐฯ ปิดบวก ขานรับออเดอร์ชิปประมวลผล AI จาก Microsoft, Google และ Meta',
      summary_en: 'NVDA shares led US tech benchmarks higher on surging AI compute processor shipments to Microsoft, Google, and Meta.',
      keyTakeaways: [
        'ราคาหุ้น NVDA ปรับขึ้นต่อเนื่อง ตอกย้ำมูลค่าผู้นำกลุ่ม Semiconductor',
        'สถาปัตยกรรมชิปประมวลผล AI รุ่นใหม่เพิ่มประสิทธิภาพสูงขึ้นและประหยัดพลังงาน',
        'ยอดสั่งซื้อโครงสร้างพื้นฐาน AI ขยายตัวในระดับทั่วโลก'
      ],
      keyTakeaways_th: [
        'ราคาหุ้น NVDA ปรับขึ้นต่อเนื่อง ตอกย้ำมูลค่าผู้นำกลุ่ม Semiconductor',
        'สถาปัตยกรรมชิปประมวลผล AI รุ่นใหม่เพิ่มประสิทธิภาพสูงขึ้นและประหยัดพลังงาน',
        'ยอดสั่งซื้อโครงสร้างพื้นฐาน AI ขยายตัวในระดับทั่วโลก'
      ],
      keyTakeaways_en: [
        'NVDA shares extended gains, reinforcing the company\'s leadership in semiconductors.',
        'Next-generation AI architecture delivers enhanced compute throughput and energy efficiency.',
        'Global order backlog for AI data center infrastructure continues to expand.'
      ],
      fullContent: `หุ้นของ NVIDIA Corporation (NASDAQ: NVDA) ปรับตัวขึ้นต่อเนื่องหลังบริษัทประกาศความร่วมมือเชิงลึกกับผู้ให้บริการคลาวด์ระดับโลก โดยความต้องการโครงสร้างพื้นฐานสำหรับ Generative AI และ Data Center ยังคงขยายตัวอย่างแข็งแกร่ง`,
      fullContent_th: `หุ้นของ NVIDIA Corporation (NASDAQ: NVDA) ปรับตัวขึ้นต่อเนื่องหลังบริษัทประกาศความร่วมมือเชิงลึกกับผู้ให้บริการคลาวด์ระดับโลก โดยความต้องการโครงสร้างพื้นฐานสำหรับ Generative AI และ Data Center ยังคงขยายตัวอย่างแข็งแกร่ง`,
      fullContent_en: `Shares of NVIDIA Corporation (NASDAQ: NVDA) rallied as the company broadened strategic collaborations with global cloud providers, with demand for Generative AI compute and Data Centers showing unrelenting strength.`,
      region: 'global',
      timeframe: 'daily',
      marketName: 'NASDAQ',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      periodLabel_th: `สรุปรายวัน • ${dateShort}`,
      periodLabel_en: `Daily Digest • ${dateShortEn}`,
      sentiment: 'bullish',
      tickers: ['NVDA', 'MSFT', 'GOOGL', 'AMD'],
      readTime: '3 นาที',
      source: 'Bloomberg News / WSJ',
      category: 'tech',
      isFeatured: true,
      link: 'https://finance.yahoo.com/quote/NVDA',
      url: 'https://finance.yahoo.com/quote/NVDA',
      sourceUrl: 'https://finance.yahoo.com/quote/NVDA',
      impactAnalysis: {
        bullishReason: 'ออเดอร์ชิป AI ล้นมือ ตอกย้ำความเป็นผู้นำในอุตสาหกรรมชิปประมวลผล',
        bullishReason_th: 'ออเดอร์ชิป AI ล้นมือ ตอกย้ำความเป็นผู้นำในอุตสาหกรรมชิปประมวลผล',
        bullishReason_en: 'Record AI chip backlogs reinforcing undisputed leadership in accelerated computing',
        targetSector: 'Semiconductor & AI Tech',
        targetSector_th: 'เซมิคอนดักเตอร์ & เทคโนโลยี AI',
        targetSector_en: 'Semiconductor & AI Tech',
        priceTrendOutlook: 'โมเมนตัมขาขึ้นชัดเจน',
        priceTrendOutlook_th: 'โมเมนตัมขาขึ้นชัดเจน',
        priceTrendOutlook_en: 'Clear bullish momentum with upward price discovery'
      }
    },

    // --- DAILY GLOBAL NEWS 2 ---
    {
      id: 'news-d5',
      title: 'Tesla ปรับกลยุทธ์ราคารถ EV เพื่อรักษา Market Share ท่ามกลางการแข่งขันเข้มข้น',
      title_th: 'Tesla ปรับกลยุทธ์ราคารถ EV เพื่อรักษา Market Share ท่ามกลางการแข่งขันเข้มข้น',
      title_en: 'Tesla Calibrates EV Pricing Strategy to Safeguard Market Share Amid Global Competition',
      summary: 'ราคาหุ้น TSLA มีการแกว่งตัว หลังปรับโครงสร้างราคารถยนต์ไฟฟ้า Model Y ในตลาดยุโรปและเอเชีย',
      summary_th: 'ราคาหุ้น TSLA มีการแกว่งตัว หลังปรับโครงสร้างราคารถยนต์ไฟฟ้า Model Y ในตลาดยุโรปและเอเชีย',
      summary_en: 'TSLA stock exhibited volatility following targeted price adjustments on Model Y vehicles across European and Asian markets.',
      keyTakeaways: [
        'การปรับกลยุทธ์ราคาเน้นรักษาปริมาณยอดส่งมอบรถยนต์ท่ามกลางการแข่งขันสูง',
        'นักลงทุนจับตาความคืบหน้าระบบ Autonomous Driving และ Full Self-Driving (FSD)'
      ],
      keyTakeaways_th: [
        'การปรับกลยุทธ์ราคาเน้นรักษาปริมาณยอดส่งมอบรถยนต์ท่ามกลางการแข่งขันสูง',
        'นักลงทุนจับตาความคืบหน้าระบบ Autonomous Driving และ Full Self-Driving (FSD)'
      ],
      keyTakeaways_en: [
        'Pricing strategy aims to sustain delivery volume in a highly competitive EV market.',
        'Investors remain focused on progress in Full Self-Driving (FSD) and autonomous mobility.'
      ],
      fullContent: `หุ้น Tesla, Inc. (NASDAQ: TSLA) มีการเคลื่อนไหวตามข่าวการปรับราคาในตลาดยุโรปและเอเชียเพื่อกระตุ้นยอดส่งมอบ ขณะที่ตลาดให้ความสนใจเทคโนโลยีระบบขับเคลื่อนอัตโนมัติ AI และหุ่นยนต์ Optimus ในระยะยาว`,
      fullContent_th: `หุ้น Tesla, Inc. (NASDAQ: TSLA) มีการเคลื่อนไหวตามข่าวการปรับราคาในตลาดยุโรปและเอเชียเพื่อกระตุ้นยอดส่งมอบ ขณะที่ตลาดให้ความสนใจเทคโนโลยีระบบขับเคลื่อนอัตโนมัติ AI และหุ่นยนต์ Optimus ในระยะยาว`,
      fullContent_en: `Shares of Tesla, Inc. (NASDAQ: TSLA) traded actively following price optimizations in Europe and Asia, while the market maintains keen interest in AI autonomous driving and humanoid robotics.`,
      region: 'global',
      timeframe: 'daily',
      marketName: 'NASDAQ',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      periodLabel_th: `สรุปรายวัน • ${dateShort}`,
      periodLabel_en: `Daily Digest • ${dateShortEn}`,
      sentiment: 'bearish',
      tickers: ['TSLA', 'BYD'],
      readTime: '2 นาที',
      source: 'Reuters Financial',
      category: 'tech',
      link: 'https://finance.yahoo.com/quote/TSLA',
      url: 'https://finance.yahoo.com/quote/TSLA',
      sourceUrl: 'https://finance.yahoo.com/quote/TSLA',
      impactAnalysis: {
        bearishReason: 'การแข่งขันราคารถ EV กดดัน Margin ระยะสั้น',
        bearishReason_th: 'การแข่งขันราคารถ EV กดดัน Margin ระยะสั้น',
        bearishReason_en: 'Intensifying EV price wars creating short-term margin compression',
        bullishReason: 'ยังมีปัจจัยบวกจากเทคโนโลยี Autonomous Driving',
        bullishReason_th: 'ยังมีปัจจัยบวกจากเทคโนโลยี Autonomous Driving',
        bullishReason_en: 'Long-term upside potential from Full Self-Driving and AI software monetization',
        targetSector: 'ยานยนต์ไฟฟ้า & เทคโนโลยีสะอาด',
        targetSector_th: 'ยานยนต์ไฟฟ้า & เทคโนโลยีสะอาด',
        targetSector_en: 'Automotive & Clean Tech',
        priceTrendOutlook: 'มีโอกาสแกว่งตัวผันผวนระยะสั้นเพื่อทดสอบฐานแนวรับ',
        priceTrendOutlook_th: 'มีโอกาสแกว่งตัวผันผวนระยะสั้นเพื่อทดสอบฐานแนวรับ',
        priceTrendOutlook_en: 'Short-term volatility as the stock tests key support levels'
      }
    },

    // --- WEEKLY THAI NEWS ---
    {
      id: 'news-w1',
      title: 'สรุปสัปดาห์หุ้นไทย: SET ปรับตัวขึ้นเด่น รับ Fund Flow และแรงซื้อหุ้นใหญ่',
      title_th: 'สรุปสัปดาห์หุ้นไทย: SET ปรับตัวขึ้นเด่น รับ Fund Flow และแรงซื้อหุ้นใหญ่',
      title_en: 'Thai Weekly Wrap: SET Index Advances on Foreign Fund Flows & Blue-Chip Accumulation',
      summary: 'ภาพรวมตลาดหุ้นไทยรายสัปดาห์ปรับตัวขึ้นรับปัจจัยบวก เงินบาทแข็งค่า และสัญญาณการฟื้นตัวของเศรษฐกิจ',
      summary_th: 'ภาพรวมตลาดหุ้นไทยรายสัปดาห์ปรับตัวขึ้นรับปัจจัยบวก เงินบาทแข็งค่า และสัญญาณการฟื้นตัวของเศรษฐกิจ',
      summary_en: 'Thai equities closed the week in positive territory, supported by Thai Baht appreciation, tourism recovery, and macroeconomic tailwinds.',
      keyTakeaways: [
        'SET Index รายสัปดาห์ปรับตัวขึ้นสะท้อนความเชื่อมั่นนักลงทุน',
        'นักลงทุนต่างชาติและสถาบันเข้าซื้อสะสมในหุ้น Big Cap',
        'กลุ่มเด่นประจำสัปดาห์: อิเล็กทรอนิกส์, พลังงาน, การเงิน'
      ],
      keyTakeaways_th: [
        'SET Index รายสัปดาห์ปรับตัวขึ้นสะท้อนความเชื่อมั่นนักลงทุน',
        'นักลงทุนต่างชาติและสถาบันเข้าซื้อสะสมในหุ้น Big Cap',
        'กลุ่มเด่นประจำสัปดาห์: อิเล็กทรอนิกส์, พลังงาน, การเงิน'
      ],
      keyTakeaways_en: [
        'Weekly SET Index performance reflected strengthening investor sentiment.',
        'Foreign and institutional investors steadily accumulated SET50 large caps.',
        'Top sector performers of the week: Electronics, Energy, and Financial Services.'
      ],
      fullContent: `สรุปภาพรวมตลาดหุ้นไทยรายสัปดาห์ ดัชนี SET Index มีแนวโน้มปรับตัวขึ้น เม็ดเงินลงทุนไหลกลับเข้าสู่ตลาดหุ้นภูมิภาคตามสภาพคล่องในตลาดโลก`,
      fullContent_th: `สรุปภาพรวมตลาดหุ้นไทยรายสัปดาห์ ดัชนี SET Index มีแนวโน้มปรับตัวขึ้น เม็ดเงินลงทุนไหลกลับเข้าสู่ตลาดหุ้นภูมิภาคตามสภาพคล่องในตลาดโลก`,
      fullContent_en: `In the weekly review of the Thai stock market, the SET Index gained solidly as global capital flowed back into regional emerging markets supported by high international liquidity.`,
      region: 'thai',
      timeframe: 'weekly',
      marketName: 'SET Index',
      date: dateShort,
      periodLabel: `สรุปสัปดาห์ • ${dateShort}`,
      periodLabel_th: `สรุปสัปดาห์ • ${dateShort}`,
      periodLabel_en: `Weekly Digest • ${dateShortEn}`,
      sentiment: 'bullish',
      tickers: ['SET', 'KBANK', 'PTT', 'ADVANC', 'DELTA'],
      readTime: '4 นาที',
      source: 'SET Market Intelligence',
      category: 'macro',
      isFeatured: true,
      link: 'https://www.set.or.th',
      url: 'https://www.set.or.th',
      sourceUrl: 'https://www.set.or.th',
      impactAnalysis: {
        bullishReason: 'Fund Flow ไหลเข้าต่อเนื่อง + สภาพคล่องโลกสูง',
        bullishReason_th: 'Fund Flow ไหลเข้าต่อเนื่อง + สภาพคล่องโลกสูง',
        bullishReason_en: 'Continuous institutional fund inflows and abundant global market liquidity',
        targetSector: 'หุ้น Big Cap SET50',
        targetSector_th: 'หุ้น Big Cap SET50',
        targetSector_en: 'SET50 Large Cap Constituents',
        priceTrendOutlook: 'ภาพรวมแกว่งตัวขึ้นเน้นสะสมหุ้นปันผลและหุ้นเติบโต',
        priceTrendOutlook_th: 'ภาพรวมแกว่งตัวขึ้นเน้นสะสมหุ้นปันผลและหุ้นเติบโต',
        priceTrendOutlook_en: 'Upward trend favoring accumulation of high-dividend blue chips and growth leaders'
      }
    },

    // --- WEEKLY GLOBAL NEWS ---
    {
      id: 'news-w2',
      title: 'สรุปสัปดาห์ Wall Street: S&P 500 และ NASDAQ เดินหน้าทำจุดสูงสุดใหม่ต่อเนื่อง',
      title_th: 'สรุปสัปดาห์ Wall Street: S&P 500 และ NASDAQ เดินหน้าทำจุดสูงสุดใหม่ต่อเนื่อง',
      title_en: 'Wall Street Weekly Wrap: S&P 500 & NASDAQ Power Ahead to Fresh Highs on AI Momentum',
      summary: 'ตลาดหุ้นสหรัฐฯ ปิดสัปดาห์สดใส รับแรงหนุนจากหุ้นกลุ่มเทคโนโลยี AI และรายงานตัวเลขเศรษฐกิจที่แข็งแกร่ง',
      summary_th: 'ตลาดหุ้นสหรัฐฯ ปิดสัปดาห์สดใส รับแรงหนุนจากหุ้นกลุ่มเทคโนโลยี AI และรายงานตัวเลขเศรษฐกิจที่แข็งแกร่ง',
      summary_en: 'US equity benchmarks closed the week strongly, propelled by AI mega-caps and resilient macroeconomic data supporting a soft-landing scenario.',
      keyTakeaways: [
        'NASDAQ และ S&P 500 ปรับตัวขึ้นต่อเนื่อง',
        'หุ้น AI และ Semiconductor ปรับตัวขึ้นโดดเด่น — หุ้นเด่น: $NVDA, $MSFT, $AAPL',
        'ตัวเลขเศรษฐกิจสะท้อนภาพ Soft Landing'
      ],
      keyTakeaways_th: [
        'NASDAQ และ S&P 500 ปรับตัวขึ้นต่อเนื่อง',
        'หุ้น AI และ Semiconductor ปรับตัวขึ้นโดดเด่น — หุ้นเด่น: $NVDA, $MSFT, $AAPL',
        'ตัวเลขเศรษฐกิจสะท้อนภาพ Soft Landing'
      ],
      keyTakeaways_en: [
        'NASDAQ and S&P 500 posted consistent weekly advances.',
        'AI and semiconductor leaders outperformed, led by NVDA, MSFT, and AAPL.',
        'Macro indicators supported an economic soft landing with moderating inflation.'
      ],
      fullContent: `ตลาดหุ้นวอลล์สตรีทปรับตัวขึ้นอย่างแข็งแกร่ง ดัชนีหลักทั้งสามดัชนีปิดสัปดาห์ในแดนบวก ขานรับนโยบายการเงินและผลประกอบการบริษัทจดทะเบียนที่แข็งแกร่ง`,
      fullContent_th: `ตลาดหุ้นวอลล์สตรีทปรับตัวขึ้นอย่างแข็งแกร่ง ดัชนีหลักทั้งสามดัชนีปิดสัปดาห์ในแดนบวก ขานรับนโยบายการเงินและผลประกอบการบริษัทจดทะเบียนที่แข็งแกร่ง`,
      fullContent_en: `Wall Street markets rallied robustly, with all major indices finishing the week in the green, buoyed by supportive monetary policy signals and corporate earnings strength.`,
      region: 'global',
      timeframe: 'weekly',
      marketName: 'S&P 500 & NASDAQ',
      date: dateShort,
      periodLabel: `สรุปสัปดาห์ • ${dateShort}`,
      periodLabel_th: `สรุปสัปดาห์ • ${dateShort}`,
      periodLabel_en: `Weekly Digest • ${dateShortEn}`,
      sentiment: 'bullish',
      tickers: ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'],
      readTime: '4 นาที',
      source: 'Yahoo Finance & Reuters',
      category: 'tech',
      isFeatured: true,
      link: 'https://finance.yahoo.com',
      url: 'https://finance.yahoo.com',
      sourceUrl: 'https://finance.yahoo.com',
      impactAnalysis: {
        bullishReason: 'นโยบายการเงินยืดหยุ่น + บริษัทเทคฯ สภาพคล่องสูง',
        bullishReason_th: 'นโยบายการเงินยืดหยุ่น + บริษัทเทคฯ สภาพคล่องสูง',
        bullishReason_en: 'Flexible monetary policy expectations coupled with mega-cap cash balance strength',
        targetSector: 'หุ้นเทคโนโลยีขนาดใหญ่ของสหรัฐฯ',
        targetSector_th: 'หุ้นเทคโนโลยีขนาดใหญ่ของสหรัฐฯ',
        targetSector_en: 'US Mega-Cap Tech & Growth Equities',
        priceTrendOutlook: 'ทิศทางขาขึ้นต่อเนื่อง (Bull Market)',
        priceTrendOutlook_th: 'ทิศทางขาขึ้นต่อเนื่อง (Bull Market)',
        priceTrendOutlook_en: 'Sustained secular bull market with broad participation'
      }
    }
  ];

  return items.map((i) => enrichDualLanguageNewsItem(i) as StockNewsItem);
}

export const mockDailyDigestSummary: DailyWeeklyDigestSummary = getDynamicDailyDigestSummary();
export const mockWeeklyDigestSummary: DailyWeeklyDigestSummary = getDynamicWeeklyDigestSummary();
export const mockNewsItems: StockNewsItem[] = getDynamicMockNewsItems();
