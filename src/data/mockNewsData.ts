import type { StockNewsItem, DailyWeeklyDigestSummary } from '../types/stockNews';

function getCurrentDateDetails() {
  const now = new Date();
  const dateShort = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const dateFull = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
  const isoDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  return { now, dateShort, dateFull, timeStr, isoDate };
}

export function getDynamicDailyDigestSummary(): DailyWeeklyDigestSummary {
  const { dateFull, dateShort, timeStr, isoDate } = getCurrentDateDetails();
  return {
    id: `digest-daily-${isoDate}`,
    periodLabel: `สรุปภาพรวมตลาดประจำวันที่ ${dateFull}`,
    timeframe: 'daily',
    region: 'all',
    mainHeadline: 'SET Index และตลาดหุ้นโลกเคลื่อนไหวคึกคัก รับกระแสเงินลงทุน AI และทิศทางดอกเบี้ยโลก',
    overviewSummary: 'ตลาดหุ้นไทยและตลาดสากลตอบรับเชิงบวกต่อภาพรวมเศรษฐกิจและเม็ดเงินลงทุนในอุตสาหกรรมเทคโนโลยี AI โดยมีแรงซื้อกระจายตัวในกลุ่มพลังงาน ธนาคาร และอิเล็กทรอนิกส์ชั้นนำ พร้อมระบบวิเคราะห์ข้อมูลราคาแบบ Real-time ตลอดวัน',
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
    topWatchlistTickers: ['PTT', 'DELTA', 'CPALL', 'NVDA', 'AAPL'],
    updatedAt: `${dateShort} | ${timeStr}`
  };
}

export function getDynamicWeeklyDigestSummary(): DailyWeeklyDigestSummary {
  const { dateFull, dateShort, timeStr, isoDate } = getCurrentDateDetails();
  return {
    id: `digest-weekly-${isoDate}`,
    periodLabel: `สรุปสัปดาห์ล่าสุด (${dateShort})`,
    timeframe: 'weekly',
    region: 'all',
    mainHeadline: 'สรุปสัปดาห์: สัญญาณ Fund Flow ไหลเข้าตลาดเอเชียและหุ้นเทคฯ สหรัฐฯ แข็งแกร่ง',
    overviewSummary: 'ตลอดสัปดาห์ที่ผ่านมา ตลาดหุ้นทั่วโลกตอบรับเชิงบวกต่อสภาพคล่องในระบบและการเติบโตของผลประกอบการบริษัทชั้นนำ ส่งผลให้เกิดแรงซื้อสุทธิสะสมในหุ้น Big Cap และกลุ่มเทคโนโลยีระดับโลกอย่างต่อเนื่อง',
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
    topWatchlistTickers: ['ADVANC', 'BDMS', 'KBANK', 'TSLA', 'MSFT'],
    updatedAt: `${dateShort} | ${timeStr}`
  };
}

export function getDynamicMockNewsItems(): StockNewsItem[] {
  const { dateShort, timeStr } = getCurrentDateDetails();
  return [
    // --- DAILY THAI NEWS ---
    {
      id: 'news-d1',
      title: 'SET Index ขยับบวกสดใส แรงซื้อ PTT-DELTA หนุนตลาดรับทิศทางความเชื่อมั่นการลงทุน',
      summary: 'ดัชนีตลาดหุ้นไทยปรับตัวในแดนบวก นำโดยกลุ่มพลังงานและกลุ่มเทคโนโลยี ขานรับทิศทางตลาดโลกและแรงซื้อของนักลงทุนสถาบัน',
      keyTakeaways: [
        'SET Index เคลื่อนไหวในทิศทางบวก ดัชนีตอบรับปัจจัยพื้นฐานและเม็ดเงินลงทุนใหม่',
        'หุ้น PTT และกลุ่มพลังงานฟื้นตัวเด่น รับอุปสงค์พลังงานและทิศทางราคาน้ำมันทรงตัวสูง',
        'DELTA และชิ้นส่วนอิเล็กทรอนิกส์ได้แรงหนุนจากออเดอร์ระบบประมวลผล AI',
        'สัดส่วนการซื้อขายคึกคัก สะท้อนความเชื่อมั่นของนักลงทุนในประเทศและต่างชาติ'
      ],
      fullContent: `ดัชนีตลาดหลักทรัพย์แห่งประเทศไทย (SET Index) ปรับตัวเพิ่มขึ้นอย่างต่อเนื่อง โดยมีมูลค่าการซื้อขายหนาแน่น บรรยากาศการลงทุนเป็นไปอย่างคึกคัก นำโดยหุ้นกลุ่มพลังงานขนาดใหญ่และกลุ่มเทคโนโลยี\n\nนอกจากนี้ หุ้นกลุ่มชิ้นส่วนอิเล็กทรอนิกส์อย่าง DELTA ปรับตัวขึ้นตอบรับกระแสการลงทุนในศูนย์ข้อมูล (Data Center) และโครงสร้างพื้นฐาน AI ในภูมิภาคที่มีอัตราเติบโตสูงต่อเนื่อง`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET Index',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      sentiment: 'bullish',
      tickers: ['PTT', 'DELTA', 'PTTEP'],
      readTime: '2 นาที',
      audioDuration: '1:30',
      source: 'สำนักข่าวการเงินไทย (SET)',
      category: 'macro',
      isFeatured: true,
      link: 'https://www.settrade.com',
      url: 'https://www.settrade.com',
      sourceUrl: 'https://www.settrade.com',
      impactAnalysis: {
        bullishReason: 'ทิศทางเศรษฐกิจฟื้นตัว + เงินทุนไหลเข้าหุ้น Big Cap',
        targetSector: 'พลังงาน & เทคโนโลยี',
        priceTrendOutlook: 'คาดการณ์แนวโน้มระยะสั้นทดสอบแนวต้านสำคัญต่อเนื่อง'
      }
    },
    {
      id: 'news-d2',
      title: 'CPALL ยอดขายสาขาเดิม (SSSG) โตแกร่ง รับอานิสงส์บริโภคในประเทศและนักท่องเที่ยว',
      summary: 'ซีพี ออลล์ เผยยอดขายร้าน 7-Eleven ขยายตัวดีจากกลุ่มอาหารพร้อมทาน เครื่องดื่ม และการใช้จ่ายของนักท่องเที่ยว',
      keyTakeaways: [
        'SSSG ขยายตัวต่อเนื่อง โดดเด่นในสาขาจังหวัดท่องเที่ยวหลักและชุมชนเมือง',
        'รายได้จากกลุ่มอาหารพร้อมทานและเครื่องดื่ม All Café เติบโตสองหลัก',
        'แผนขยายสาขาใหม่ทั่วประเทศคืบหน้าตามเป้าหมาย'
      ],
      fullContent: `บริษัท ซีพี ออลล์ จำกัด (มหาชน) หรือ CPALL แถลงยอดขายจากสาขาเดิม (Same Store Sales Growth: SSSG) เติบโตต่อเนื่อง ปัจจัยขับเคลื่อนหลักมาจากกำลังซื้อในประเทศและจำนวนนักท่องเที่ยวที่เพิ่มขึ้น ส่งผลให้ยอดซื้อต่อบิลปรับตัวสูงขึ้น`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET50',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      sentiment: 'bullish',
      tickers: ['CPALL', 'CPAXT'],
      readTime: '3 นาที',
      audioDuration: '1:50',
      source: 'ข่าวหุ้นอินไซด์ (Kaohoon)',
      category: 'retail',
      link: 'https://www.kaohoon.com',
      url: 'https://www.kaohoon.com',
      sourceUrl: 'https://www.kaohoon.com',
      impactAnalysis: {
        bullishReason: 'ยอดขายสาขาเดิมขยายตัวแข็งแกร่ง อัตรากำไรขั้นต้นปรับตัวดีขึ้น',
        targetSector: 'พาณิชย์ & ค้าปลีก',
        priceTrendOutlook: 'ลุ้นทดสอบราคาเป้าหมายตามกรอบสะสม'
      }
    },
    {
      id: 'news-d3',
      title: 'BDMS ประกาศงบลงทุนขยายศูนย์การแพทย์เฉพาะทางรองรับ Medical Tourism',
      summary: 'กรุงเทพดุสิตเวชการ รุกยกระดับความเป็นเลิศทางการแพทย์ เปิดศูนย์การรักษาโรคซับซ้อนใหม่ รักษาสัดส่วนผู้ป่วยต่างชาติสูง',
      keyTakeaways: [
        'งบลงทุนมุ่งเน้นศูนย์ความเป็นเลิศด้านมะเร็ง หัวใจ และสมอง',
        'รายได้จากผู้ป่วยต่างชาติคิดเป็นสัดส่วนสำคัญ เติบโตจากตะวันออกกลางและอาเซียน',
        'คาดหนุนการเติบโตของรายได้ระยะยาวอย่างมั่นคง'
      ],
      fullContent: `บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน) หรือ BDMS เปิดเผยแผนยุทธศาสตร์มุ่งเน้นการขยายขีดความสามารถการรักษาโรคซับซ้อนระดับสูง (Tertiary Care) เพื่อรองรับความต้องการที่เพิ่มขึ้นของผู้ป่วยทั้งในและต่างประเทศ`,
      region: 'thai',
      timeframe: 'daily',
      marketName: 'SET50',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      sentiment: 'neutral',
      tickers: ['BDMS', 'BH'],
      readTime: '2 นาที',
      audioDuration: '1:20',
      source: 'Money Channel Thailand',
      category: 'health',
      link: 'https://www.set.or.th',
      url: 'https://www.set.or.th',
      sourceUrl: 'https://www.set.or.th',
      impactAnalysis: {
        bullishReason: 'เติบโตยั่งยืนจากเทรนด์สังคมสูงวัยและผู้ป่วยต่างชาติ',
        bearishReason: 'ใช้เงินลงทุนสูงในระยะสั้น อาจกดดันผลตอบแทนชั่วคราว',
        targetSector: 'การแพทย์ & โรงพยาบาล'
      }
    },
    // --- DAILY GLOBAL NEWS ---
    {
      id: 'news-d4',
      title: 'NVIDIA เดินหน้าขยายไลน์ชิป AI รุ่นใหม่ จับมือพันธมิตรคลาวด์ระดับโลก',
      summary: 'หุ้น NVDA นำทัพหุ้นกลุ่มเทคโนโลยีสหรัฐฯ ปิดบวก ขานรับออเดอร์ชิปประมวลผล AI จาก Microsoft, Google และ Meta',
      keyTakeaways: [
        'ราคาหุ้น NVDA ปรับขึ้นต่อเนื่อง ตอกย้ำมูลค่าผู้นำกลุ่ม Semiconductor',
        'สถาปัตยกรรมชิปประมวลผล AI รุ่นใหม่เพิ่มประสิทธิภาพสูงขึ้นและประหยัดพลังงาน',
        'ยอดสั่งซื้อโครงสร้างพื้นฐาน AI ขยายตัวในระดับทั่วโลก'
      ],
      fullContent: `หุ้นของ NVIDIA Corporation (NASDAQ: NVDA) ปรับตัวขึ้นต่อเนื่องหลังบริษัทประกาศความร่วมมือเชิงลึกกับผู้ให้บริการคลาวด์ระดับโลก โดยความต้องการโครงสร้างพื้นฐานสำหรับ Generative AI และ Data Center ยังคงขยายตัวอย่างแข็งแกร่ง`,
      region: 'global',
      timeframe: 'daily',
      marketName: 'NASDAQ',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      sentiment: 'bullish',
      tickers: ['NVDA', 'MSFT', 'GOOGL', 'AMD'],
      readTime: '3 นาที',
      audioDuration: '2:10',
      source: 'Bloomberg News / WSJ',
      category: 'tech',
      isFeatured: true,
      link: 'https://finance.yahoo.com/quote/NVDA',
      url: 'https://finance.yahoo.com/quote/NVDA',
      sourceUrl: 'https://finance.yahoo.com/quote/NVDA',
      impactAnalysis: {
        bullishReason: 'ออเดอร์ชิป AI ล้นมือ ตอกย้ำความเป็นผู้นำในอุตสาหกรรมชิปประมวลผล',
        targetSector: 'Semiconductor & AI Tech',
        priceTrendOutlook: 'โมเมนตัมขาขึ้นชัดเจน'
      }
    },
    {
      id: 'news-d5',
      title: 'Tesla ปรับกลยุทธ์ราคารถ EV เพื่อรักษา Market Share ท่ามกลางการแข่งขันเข้มข้น',
      summary: 'ราคาหุ้น TSLA มีการแกว่งตัว หลังปรับโครงสร้างราคารถยนต์ไฟฟ้า Model Y ในตลาดยุโรปและเอเชีย',
      keyTakeaways: [
        'การปรับกลยุทธ์ราคาเน้นรักษาปริมาณยอดส่งมอบรถยนต์ท่ามกลางการแข่งขันสูง',
        'นักลงทุนจับตาความคืบหน้าระบบ Autonomous Driving และ Full Self-Driving (FSD)'
      ],
      fullContent: `หุ้น Tesla, Inc. (NASDAQ: TSLA) มีการเคลื่อนไหวตามข่าวการปรับราคาในตลาดยุโรปและเอเชียเพื่อกระตุ้นยอดส่งมอบ ขณะที่ตลาดให้ความสนใจเทคโนโลยีระบบขับเคลื่อนอัตโนมัติ AI และหุ่นยนต์ Optimus ในระยะยาว`,
      region: 'global',
      timeframe: 'daily',
      marketName: 'NASDAQ',
      date: dateShort,
      time: timeStr,
      periodLabel: `สรุปรายวัน • ${dateShort}`,
      sentiment: 'bearish',
      tickers: ['TSLA', 'BYD'],
      readTime: '2 นาที',
      audioDuration: '1:15',
      source: 'Reuters Financial',
      category: 'tech',
      link: 'https://finance.yahoo.com/quote/TSLA',
      url: 'https://finance.yahoo.com/quote/TSLA',
      sourceUrl: 'https://finance.yahoo.com/quote/TSLA',
      impactAnalysis: {
        bearishReason: 'การแข่งขันราคารถ EV กดดัน Margin ระยะสั้น',
        bullishReason: 'ยังมีปัจจัยบวกจากเทคโนโลยี Autonomous Driving',
        targetSector: 'Automotive & Clean Tech'
      }
    },
    // --- WEEKLY THAI NEWS ---
    {
      id: 'news-w1',
      title: 'สรุปสัปดาห์หุ้นไทย: SET ปรับตัวขึ้นเด่น รับ Fund Flow และแรงซื้อหุ้นใหญ่',
      summary: 'ภาพรวมตลาดหุ้นไทยรายสัปดาห์ปรับตัวขึ้นรับปัจจัยบวก เงินบาทแข็งค่า และสัญญาณการฟื้นตัวของเศรษฐกิจ',
      keyTakeaways: [
        'SET Index รายสัปดาห์ปรับตัวขึ้นสะท้อนความเชื่อมั่นนักลงทุน',
        'นักลงทุนต่างชาติและสถาบันเข้าซื้อสะสมในหุ้น Big Cap',
        'กลุ่มเด่นประจำสัปดาห์: อิเล็กทรอนิกส์, พลังงาน, การเงิน'
      ],
      fullContent: `สรุปภาพรวมตลาดหุ้นไทยรายสัปดาห์ ดัชนี SET Index มีแนวโน้มปรับตัวขึ้น เม็ดเงินลงทุนไหลกลับเข้าสู่ตลาดหุ้นภูมิภาคตามสภาพคล่องในตลาดโลก`,
      region: 'thai',
      timeframe: 'weekly',
      marketName: 'SET Index',
      date: dateShort,
      periodLabel: `สรุปสัปดาห์ • ${dateShort}`,
      sentiment: 'bullish',
      tickers: ['SET', 'KBANK', 'PTT', 'ADVANC', 'DELTA'],
      readTime: '4 นาที',
      audioDuration: '3:00',
      source: 'SET Market Intelligence',
      category: 'macro',
      isFeatured: true,
      link: 'https://www.set.or.th',
      url: 'https://www.set.or.th',
      sourceUrl: 'https://www.set.or.th',
      impactAnalysis: {
        bullishReason: 'Fund Flow ไหลเข้าต่อเนื่อง + สภาพคล่องโลกสูง',
        targetSector: 'หุ้น Big Cap SET50',
        priceTrendOutlook: 'ภาพรวมแกว่งตัวขึ้นเน้นสะสมหุ้นปันผลและหุ้นเติบโต'
      }
    },
    // --- WEEKLY GLOBAL NEWS ---
    {
      id: 'news-w2',
      title: 'สรุปสัปดาห์ Wall Street: S&P 500 และ NASDAQ เดินหน้าทำจุดสูงสุดใหม่ต่อเนื่อง',
      summary: 'ตลาดหุ้นสหรัฐฯ ปิดสัปดาห์สดใส รับแรงหนุนจากหุ้นกลุ่มเทคโนโลยี AI และรายงานตัวเลขเศรษฐกิจที่แข็งแกร่ง',
      keyTakeaways: [
        'NASDAQ และ S&P 500 ปรับตัวขึ้นต่อเนื่อง',
        'หุ้น AI และ Semiconductor ปรับตัวขึ้นโดดเด่นนำโดย NVDA, MSFT, AAPL',
        'ตัวเลขเศรษฐกิจสะท้อนภาพ Soft Landing'
      ],
      fullContent: `ตลาดหุ้นวอลล์สตรีทปรับตัวขึ้นอย่างแข็งแกร่ง ดัชนีหลักทั้งสามดัชนีปิดสัปดาห์ในแดนบวก ขานรับนโยบายการเงินและผลประกอบการบริษัทจดทะเบียนที่แข็งแกร่ง`,
      region: 'global',
      timeframe: 'weekly',
      marketName: 'S&P 500 & NASDAQ',
      date: dateShort,
      periodLabel: `สรุปสัปดาห์ • ${dateShort}`,
      sentiment: 'bullish',
      tickers: ['NVDA', 'AAPL', 'MSFT', 'AMZN', 'GOOGL'],
      readTime: '4 นาที',
      audioDuration: '2:45',
      source: 'Yahoo Finance & Reuters',
      category: 'tech',
      isFeatured: true,
      link: 'https://finance.yahoo.com',
      url: 'https://finance.yahoo.com',
      sourceUrl: 'https://finance.yahoo.com',
      impactAnalysis: {
        bullishReason: 'นโยบายการเงินยืดหยุ่น + บริษัทเทคฯ สภาพคล่องสูง',
        targetSector: 'US Megacap Tech & Growth Stocks',
        priceTrendOutlook: 'ทิศทางขาขึ้นต่อเนื่อง (Bull Market)'
      }
    }
  ];
}

export const mockDailyDigestSummary: DailyWeeklyDigestSummary = getDynamicDailyDigestSummary();
export const mockWeeklyDigestSummary: DailyWeeklyDigestSummary = getDynamicWeeklyDigestSummary();
export const mockNewsItems: StockNewsItem[] = getDynamicMockNewsItems();
