import { SET100_TICKERS, THAI_7_GIANTS, MAGNIFICENT_7, RECENT_IPOS } from './stockTagHelper';

// Common stop words to prevent false positives when searching uppercase tickers
export const COMMON_IGNORE_WORDS = new Set([
  'AI', 'THE', 'AND', 'FOR', 'NOT', 'BUT', 'BUY', 'SELL', 'CAN', 'MAY', 'NEW',
  'NOW', 'TOP', 'ALL', 'SEE', 'DAY', 'GET', 'HAS', 'HAD', 'ARE', 'WAS', 'PER',
  'NET', 'LOW', 'RUN', 'SET', 'THB', 'USD', 'CEO', 'CFO', 'EPS', 'GDP', 'FED',
  'BOT', 'SEC', 'IPO', 'FREE', 'PRO', 'VIP', 'CHAT', 'HELP', 'WHAT', 'HOW',
  'WHEN', 'WHERE', 'WHY', 'WHO', 'WILL', 'WITH', 'FROM', 'HAVE', 'THIS', 'THAT',
  'LITE', 'TRUE', 'REAL', 'TIME', 'GOOD', 'BAD', 'HOLD', 'INFO', 'DOC'
]);

// Mapping Thai names, brand names, and vernacular terms to official stock tickers
export const THAI_STOCK_MAP: Record<string, string> = {
  // SET Energy & Utilities
  'ปตท.': 'PTT',
  'ปตท': 'PTT',
  'ปตทสผ': 'PTTEP',
  'ปตท.สผ': 'PTTEP',
  'สผ': 'PTTEP',
  'ไทยออยล์': 'TOP',
  'ท็อป': 'TOP',
  'บางจาก': 'BCP',
  'บีซีพี': 'BCP',
  'พีทีทีจีซี': 'PTTGC',
  'ไออาร์พีซี': 'IRPC',
  'กัลฟ์': 'GULF',
  'กัลฟ์เอ็นเนอร์จี': 'GULF',
  'บีกริม': 'BGRIM',
  'ราชบุรี': 'RATCH',
  'ผลิตไฟฟ้า': 'EGCO',
  'บ้านปู': 'BANPU',
  'ดับบลิวเอชเอ': 'WHA',
  'โออาร์': 'OR',
  'ปตทโออาร์': 'OR',
  'อีเอ': 'EA',

  // SET Banking & Finance
  'กสิกรไทย': 'KBANK',
  'กสิกร': 'KBANK',
  'เคแบงก์': 'KBANK',
  'ไทยพาณิชย์': 'SCB',
  'เอสซีบี': 'SCB',
  'กรุงเทพ': 'BBL',
  'แบงก์กรุงเทพ': 'BBL',
  'กรุงไทย': 'KTB',
  'กรุงศรี': 'BAY',
  'ทีทีบี': 'TTB',
  'ทหารไทยธนชาต': 'TTB',
  'ทิสโก้': 'TISCO',
  'เกียรตินาคิน': 'KKP',
  'สวัสดิ์': 'SAWAD',
  'ศรีสวัสดิ์': 'SAWAD',
  'เมืองไทยแคป': 'MTC',
  'เมืองไทยแคปปิตอล': 'MTC',
  'เงินติดล้อ': 'TIDLOR',
  'ติดล้อ': 'TIDLOR',
  'เจเอ็มที': 'JMT',
  'แบม': 'BAM',

  // SET Commerce & Retail
  'ซีพีออลล์': 'CPALL',
  'ซีพีออล': 'CPALL',
  'เซเว่น': 'CPALL',
  'เซเว่นอีเลฟเว่น': 'CPALL',
  'ซีพีแอ็กซ์ตร้า': 'CPAXT',
  'แม็คโคร': 'CPAXT',
  'โลตัส': 'CPAXT',
  'เซ็นทรัลรีเทล': 'CRC',
  'โฮมโปร': 'HMPRO',
  'บิ๊กซี': 'BJC',
  'เบอร์ลี่ยุคเกอร์': 'BJC',
  'คอมเซเว่น': 'COM7',
  'เจมาร์ท': 'JMART',
  'สยามโกลบอล': 'GLOBAL',
  'ดูโฮม': 'DOHOME',

  // SET ICT & Tech
  'แอดวานซ์': 'ADVANC',
  'เอไอเอส': 'ADVANC',
  'ทรู': 'TRUE',
  'เดลต้า': 'DELTA',
  'ฮานา': 'HANA',
  'เคซีอี': 'KCE',
  'ซีซีอีที': 'CCET',

  // SET Healthcare & Tourism & Transport
  'การท่า': 'AOT',
  'สนามบิน': 'AOT',
  'การท่าอากาศยาน': 'AOT',
  'กรุงเทพดุสิต': 'BDMS',
  'บีดีเอ็มเอส': 'BDMS',
  'บำรุงราษฎร์': 'BH',
  'โรงพยาบาลจุฬารัตน์': 'CHG',
  'บางกอกเชน': 'BCH',
  'บีทีเอส': 'BTS',
  'รถไฟฟ้า': 'BEM',
  'บีอีเอ็ม': 'BEM',
  'ไมเนอร์': 'MINT',
  'ดิเอราวัณ': 'ERW',
  'เซ็นทรัลพัฒนา': 'CPN',
  'ออโรร่า': 'AURA',
  'ร้านทองออโรร่า': 'AURA',

  // SET Food & Industrial
  'ซีพีเอฟ': 'CPF',
  'เจริญโภคภัณฑ์อาหาร': 'CPF',
  'ไทยยูเนี่ยน': 'TU',
  'คาราบาว': 'CBG',
  'โอสถสภา': 'OSP',
  'อิชิตัน': 'ICHI',
  'เซ็ปเป้': 'SAPPE',
  'ปูนใหญ่': 'SCC',
  'เอสซีจี': 'SCC',
  'เอสซีจีแพคเกจจิ้ง': 'SCGP',

  // US Giants
  'เทสล่า': 'TSLA',
  'เทสลา': 'TSLA',
  'แอปเปิ้ล': 'AAPL',
  'แอปเปิล': 'AAPL',
  'ไมโครซอฟท์': 'MSFT',
  'กูเกิล': 'GOOGL',
  'อัลฟาเบท': 'GOOGL',
  'อินวิเดีย': 'NVDA',
  'เอ็นวิเดีย': 'NVDA',
  'อเมซอน': 'AMZN',
  'เมต้า': 'META',
  'เฟสบุ๊ก': 'META',
  'เน็ตฟลิกซ์': 'NFLX',

  // SpaceX / SPCX
  'สเปซเอ็กซ์': 'SPCX',
  'สเปซเอ็ก': 'SPCX',
  'สเปซเอก': 'SPCX',
  'สเปซเอ็กซ': 'SPCX',
  'สเปซ x': 'SPCX',
  'spacex': 'SPCX',
  'space x': 'SPCX',
  'spcx': 'SPCX',

  // Commodities & Crypto (Specific unambiguous terms only)
  'เอสพีดีอาร์': 'GLD',
  'spdr gold': 'GLD',
  'spdr': 'GLD',
  'บิทคอยน์': 'BTC-USD',
  'บิตคอยน์': 'BTC-USD',
  'อีเธอเรียม': 'ETH-USD',
  'อีเทอเรียม': 'ETH-USD',
};

export function extractCandidateTickers(text: string): string[] {
  if (!text) return [];
  const candidates: string[] = [];
  const lowerText = text.toLowerCase();

  // 1. Check Thai stock map (sorted by descending length to match longest word first e.g. "ปตทสผ" before "ปตท")
  const sortedThaiKeys = Object.keys(THAI_STOCK_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedThaiKeys) {
    if (text.includes(key) || lowerText.includes(key.toLowerCase())) {
      const mapped = THAI_STOCK_MAP[key];
      if (!candidates.includes(mapped)) {
        candidates.push(mapped);
      }
    }
  }

  // 2. Pattern: $TICKER (e.g. $NVDA, $DELTA, $PTT, $SPCX)
  const dollarMatches = text.match(/\$([A-Za-z]{1,6})\b/g);
  if (dollarMatches) {
    for (const m of dollarMatches) {
      const sym = m.replace('$', '').toUpperCase().trim();
      if (!COMMON_IGNORE_WORDS.has(sym) && !candidates.includes(sym)) candidates.push(sym);
    }
  }

  // 3. Pattern: (ราคาหุ้น|วิเคราะห์หุ้น|หุ้นไทย|หุ้น|ตัว) [TICKER]
  const thaiMatches = text.match(/(?:ราคาหุ้น|วิเคราะห์หุ้น|หุ้นไทย|หุ้น|ตัว)\s*([A-Za-z]{1,6})/gi);
  if (thaiMatches) {
    for (const m of thaiMatches) {
      const sym = m.replace(/(?:ราคาหุ้น|วิเคราะห์หุ้น|หุ้นไทย|หุ้น|ตัว)\s*/i, '').replace(/[^A-Za-z0-9]/g, '').toUpperCase().trim();
      if (sym && !COMMON_IGNORE_WORDS.has(sym) && !candidates.includes(sym)) candidates.push(sym);
    }
  }

  // 4. Standalone English tokens (e.g. NVDA, PTT, CPALL, DELTA, TSLA, AAPL, MSFT, ptt, delta, spcx)
  const standaloneMatches = text.match(/[A-Za-z]{2,6}/g);
  if (standaloneMatches) {
    for (const sym of standaloneMatches) {
      const clean = sym.toUpperCase().trim();
      if (!COMMON_IGNORE_WORDS.has(clean) && !candidates.includes(clean)) {
        const isUpper = sym === clean;
        const isRecognizedStock =
          SET100_TICKERS.has(clean) ||
          THAI_7_GIANTS.has(clean) ||
          MAGNIFICENT_7.has(clean) ||
          RECENT_IPOS.has(clean) ||
          clean === 'BTC' ||
          clean === 'ETH' ||
          clean === 'GLD';

        if (isUpper || isRecognizedStock) {
          const mapped = clean === 'BTC' ? 'BTC-USD' : clean === 'ETH' ? 'ETH-USD' : clean;
          if (!candidates.includes(mapped)) {
            candidates.push(mapped);
          }
        }
      }
    }
  }

  return Array.from(new Set(candidates));
}
