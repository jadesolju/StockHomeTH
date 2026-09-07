import type { StockFundamental } from '../schemas/marketSchema';

/**
 * 7 นางฟ้าหุ้นไทย (Thai 7 Giants) - Mega-cap leaders of the Thai Stock Exchange
 */
export const THAI_7_GIANTS = new Set([
  'PTT', 'DELTA', 'CPALL', 'AOT', 'KBANK', 'SCB', 'GULF'
]);

/**
 * Official SET50 Index Constituents & BlueChip symbols
 */
export const SET50_TICKERS = new Set([
  'ADVANC', 'AOT', 'AWC', 'BANPU', 'BBL', 'BDMS', 'BEM', 'BGRIM', 'BH', 'BJC',
  'BTS', 'CBG', 'CENTEL', 'COM7', 'CPALL', 'CPAXT', 'CPF', 'CPN', 'CRC', 'DELTA',
  'EGCO', 'GLOBAL', 'GPSC', 'GULF', 'HMPRO', 'INTUCH', 'IRPC', 'IVL', 'KBANK', 'KCE',
  'KKP', 'KTB', 'KTC', 'LH', 'MINT', 'MTC', 'OR', 'OSP', 'PTT', 'PTTEP',
  'PTTGC', 'RATCH', 'SAWAD', 'SCB', 'SCC', 'SCGP', 'TCAP', 'TIDLOR', 'TISCO', 'TOP',
  'TRUE', 'TTB', 'TU', 'WHA'
]);

/**
 * Official SET100 Index Constituents (SET50 + SET100 Liquid Additions)
 */
export const SET100_TICKERS = new Set([
  // Core SET50
  'ADVANC', 'AOT', 'AWC', 'BANPU', 'BBL', 'BDMS', 'BEM', 'BGRIM', 'BH', 'BJC',
  'BTS', 'CBG', 'CENTEL', 'COM7', 'CPALL', 'CPAXT', 'CPF', 'CPN', 'CRC', 'DELTA',
  'EGCO', 'GLOBAL', 'GPSC', 'GULF', 'HMPRO', 'INTUCH', 'IRPC', 'IVL', 'KBANK', 'KCE',
  'KKP', 'KTB', 'KTC', 'LH', 'MINT', 'MTC', 'OR', 'OSP', 'PTT', 'PTTEP',
  'PTTGC', 'RATCH', 'SAWAD', 'SCB', 'SCC', 'SCGP', 'TCAP', 'TIDLOR', 'TISCO', 'TOP',
  'TRUE', 'TTB', 'TU', 'WHA',
  // Next 50 Liquid Large/Mid-Cap Constituents
  'AAV', 'ACE', 'AMATA', 'AP', 'AURA', 'BA', 'BAM', 'BCP', 'BCPG', 'BTG',
  'BYD', 'CCET', 'CHG', 'CK', 'CKP', 'DOHOME', 'ERW', 'FORTH', 'GFPT', 'HANA', 'ICHI',
  'ITC', 'JAS', 'JMART', 'JMT', 'KAMART', 'MEGA', 'MOSHI', 'NEX', 'ORI', 'PLANB', 'PR9',
  'PRM', 'PSL', 'PTG', 'QH', 'RCL', 'SAPPE', 'SCCC', 'SJWD', 'SIRI', 'SKY', 'SPALI', 'SPRC',
  'STA', 'STEC', 'STGT', 'TASCO', 'THANI', 'TKN', 'TLI', 'TPIPL', 'TPIPP', 'TTW',
  'VGI', 'WHAUP', 'XO', 'BCH', 'MASTER', 'SAV', 'BBGI', 'TIPH', 'COCOCO'
]);

/**
 * US Magnificent 7 (7 นางฟ้าหุ้นสหรัฐฯ)
 */
export const MAGNIFICENT_7 = new Set([
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA'
]);

/**
 * Recent IPOs (หุ้น IPO ล่าสุดและหุ้นดาวเด่นเข้าตลาดใหม่)
 */
export const RECENT_IPOS = new Set([
  // US IPOs
  'SPCX', 'RDDT', 'ARM', 'ALAB', 'TEM', 'RBRK', 'CART', 'BIRK', 'KVYO', 'ANRO', 'CGON', 'WAY',
  // Thai IPOs
  'OKJ', 'MEDEZE', 'TMAN', 'NEO', 'COCOCO', 'SAV', 'MASTER', 'MCA', 'TGE', 'CHAO', 'TLI', 'ITC', 'BTG'
]);

/**
 * Dow Jones Industrial Average (Dow 30 - 30 Iconic US Blue Chips)
 */
export const DOW_JONES_30 = new Set([
  'AAPL', 'AMGN', 'AMZN', 'AXP', 'BA', 'CAT', 'CRM', 'CSCO', 'CVX', 'DIS',
  'DOW', 'GS', 'HD', 'HON', 'IBM', 'INTC', 'JNJ', 'JPM', 'KO', 'MCD',
  'MMM', 'MRK', 'MSFT', 'NKE', 'NVDA', 'PG', 'SHW', 'TRV', 'UNH', 'V',
  'VZ', 'WMT'
]);

/**
 * NASDAQ-100 Top Tech, Innovation & Growth Titans
 */
export const NASDAQ_100 = new Set([
  'AAPL', 'ABNB', 'ADBE', 'ADI', 'ADP', 'ADSK', 'AEP', 'AMAT', 'AMD', 'AMGN',
  'AMZN', 'ANSS', 'ASML', 'AVGO', 'AZN', 'BIIB', 'BKNG', 'BKR', 'CDNS', 'CEG',
  'CHTR', 'CMCSA', 'COST', 'CPRT', 'CRWD', 'CSCO', 'CSGP', 'CSX', 'CTAS', 'CTSH',
  'DASH', 'DDOG', 'DLTR', 'DXCM', 'EA', 'EXC', 'FANG', 'FAST', 'FTNT', 'GEHC',
  'GFS', 'GILD', 'GOOG', 'GOOGL', 'HON', 'IDXX', 'ILMN', 'INTC', 'INTU', 'ISRG',
  'KDP', 'KHC', 'KLAC', 'LRCX', 'LULU', 'MAR', 'MCHP', 'MCO', 'MDLZ', 'MELI',
  'META', 'MNST', 'MRNA', 'MRVL', 'MSFT', 'MU', 'NFLX', 'NVDA', 'NXPI', 'ODFL',
  'ON', 'ORLY', 'PANW', 'PAYX', 'PCAR', 'PDD', 'PEP', 'PYPL', 'QCOM', 'REGN',
  'ROP', 'ROST', 'SBUX', 'SNPS', 'TEAM', 'TMUS', 'TSLA', 'TTD', 'TTWO', 'TXN',
  'VRSK', 'VRTX', 'WBD', 'WDAY', 'XEL', 'ZS', 'PLTR', 'SNOW', 'ARM', 'COIN', 'SOFI'
]);

export const SP500_TECH = new Set([
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA', 'AMD', 'AVGO',
  'QCOM', 'INTC', 'CRM', 'ADBE', 'PLTR', 'SNOW', 'CRWD', 'ORCL', 'CSCO', 'IBM',
  'NOW', 'NFLX', 'PANW', 'AMAT', 'LRCX', 'KLAC', 'TXN', 'MU', 'ARM', 'UBER'
]);

export const SP500_FINANCE = new Set([
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'V', 'MA', 'AXP', 'BRK.B',
  'PYPL', 'COIN', 'SOFI', 'SCHW', 'COF', 'USB', 'PNC', 'TFC', 'BK', 'STT',
  'KKR', 'BX', 'APO', 'CME', 'ICE', 'MCO', 'SPGI', 'TRV'
]);

export const SP500_HEALTH = new Set([
  'LLY', 'NVO', 'UNH', 'JNJ', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'BMY',
  'AMGN', 'GILD', 'ISRG', 'VRTX', 'REGN', 'MDT', 'SYK', 'BSX', 'CVS', 'HUM'
]);

export const DIVIDEND_ARISTOCRATS = new Set([
  'JNJ', 'PG', 'KO', 'PEP', 'MCD', 'XOM', 'CVX', 'ABBV', 'IBM', 'MMM', 'T', 'VZ',
  'O', 'LOW', 'CL', 'EMR', 'CAT', 'WMT', 'ADVANC', 'PTT', 'SCB', 'BBL', 'KBANK',
  'TTB', 'LH', 'SPALI', 'TISCO', 'TCAP', 'SIRI', 'ORI', 'TASCO', 'EASTW'
]);

/**
 * Derives comprehensive, accurate, and market-isolated tags for any given stock
 */
export function getStockTags(stock: StockFundamental): string[] {
  const tags: string[] = [];
  const t = stock.ticker.toUpperCase();
  const market = stock.market;

  // 1. Market & Index Tags (Strictly Isolated)
  if (market === 'SET') {
    tags.push('SET');
    if (THAI_7_GIANTS.has(t)) {
      tags.push('7 นางฟ้าหุ้นไทย');
    }
    if (SET50_TICKERS.has(t)) {
      tags.push('SET50');
      tags.push('Blue Chip');
      tags.push('SET100');
    } else if (SET100_TICKERS.has(t)) {
      tags.push('SET100');
      tags.push('Large Cap');
    } else {
      tags.push('sSET / mai');
    }
  } else {
    tags.push('US Market');
    if (MAGNIFICENT_7.has(t)) {
      tags.push('Magnificent 7');
      tags.push('AI Leader');
      tags.push('NASDAQ-100');
      tags.push('S&P 500');
    }
    if (DOW_JONES_30.has(t)) {
      tags.push('Dow Jones');
      tags.push('Blue Chip');
    }
    if (NASDAQ_100.has(t)) {
      tags.push('NASDAQ-100');
      tags.push('Tech & AI');
    }
    if (SP500_TECH.has(t) || SP500_FINANCE.has(t) || SP500_HEALTH.has(t) || DOW_JONES_30.has(t)) {
      tags.push('S&P 500');
    }
  }

  // 2. Value & Dividend Tags
  if (RECENT_IPOS.has(t)) {
    tags.push('IPO ล่าสุด');
    tags.push('Recent IPO');
  }
  if (t === 'SPCX') {
    tags.push('SpaceX');
    tags.push('Aerospace & Defense');
    tags.push('Deep Tech');
  }

  if (stock.dividendYield >= 3.0 || DIVIDEND_ARISTOCRATS.has(t)) {
    tags.push('High Dividend');
  }
  if (stock.peRatio > 0 && stock.peRatio <= 16) {
    tags.push('Value Play');
  }

  // 3. Sector-based intelligent tags
  const sec = (stock.sector || '').toLowerCase();
  if (sec.includes('tech') || sec.includes('semiconductor') || sec.includes('software') || sec.includes('electronics')) {
    tags.push('Tech & AI');
  } else if (sec.includes('energy') || sec.includes('oil') || sec.includes('gas') || sec.includes('utility') || sec.includes('power')) {
    tags.push('Energy & Power');
  } else if (sec.includes('bank') || sec.includes('finance') || sec.includes('insurance')) {
    tags.push('Banking & Finance');
  } else if (sec.includes('health') || sec.includes('pharma') || sec.includes('hospital') || sec.includes('biotech')) {
    tags.push('Healthcare');
  } else if (sec.includes('consumer') || sec.includes('retail') || sec.includes('commerce') || sec.includes('food')) {
    tags.push('Retail & Consumer');
  } else if (sec.includes('auto') || sec.includes('ev') || sec.includes('transport') || sec.includes('logistic') || sec.includes('aerospace')) {
    tags.push('EV & Mobility');
  } else if (sec.includes('telecom') || sec.includes('communication') || sec.includes('digital') || sec.includes('media')) {
    tags.push('Telecom & Media');
  } else if (sec.includes('real estate') || sec.includes('property') || sec.includes('construction')) {
    tags.push('Property & REIT');
  }

  // 4. High AI Sentiment
  if (stock.sentimentScore >= 75) {
    tags.push('High AI Score');
  }

  // 5. If stock has existing tags, cleanly merge them while stripping cross-market pollution
  if (stock.tags && stock.tags.length > 0) {
    for (const rawTag of stock.tags) {
      if (market === 'SET') {
        if (rawTag.includes('Magnificent') || rawTag.includes('S&P') || rawTag.includes('NASDAQ') || rawTag.includes('Dow') || rawTag.includes('US Market')) {
          continue;
        }
      }
      if (market === 'US') {
        if (rawTag.includes('SET') || rawTag.includes('mai') || rawTag.includes('นางฟ้า')) {
          continue;
        }
        // If it's SPCX, strip improper index tags from raw tags
        if (t === 'SPCX' && (rawTag.includes('Magnificent') || rawTag.includes('S&P 500') || rawTag.includes('NASDAQ-100'))) {
          continue;
        }
      }
      tags.push(rawTag);
    }
  }

  // Deduplicate
  const unique = Array.from(new Set(tags));

  // Enforce strict market isolation on output
  if (market === 'US') {
    return unique.filter((tg) => !tg.includes('SET') && !tg.includes('mai') && !tg.includes('นางฟ้า')).slice(0, 7);
  }
  if (market === 'SET') {
    return unique.filter((tg) => !tg.includes('Magnificent') && !tg.includes('S&P') && !tg.includes('NASDAQ') && !tg.includes('Dow')).slice(0, 7);
  }

  return unique.slice(0, 7);
}

/**
 * Curated list of popular tags specifically for Thai Stocks (SET / mai)
 */
export const THAI_MARKET_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกหมวด', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย', labelEn: 'Thai 7 Giants' },
  { id: 'IPO ล่าสุด', labelTh: 'IPO ล่าสุด', labelEn: 'Recent IPOs' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่', labelEn: 'SET100 Index' },
  { id: 'sSET / mai', labelTh: 'sSET / mai หุ้นเติบโต', labelEn: 'sSET / mai Growth' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง', labelEn: 'High Dividend' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Banking & Finance', labelTh: 'การเงิน & ธนาคาร', labelEn: 'Banking & Finance' },
  { id: 'Energy & Power', labelTh: 'พลังงาน & สาธารณูปโภค', labelEn: 'Energy & Utilities' },
  { id: 'Retail & Consumer', labelTh: 'ค้าปลีก & ท่องเที่ยว', labelEn: 'Retail & Consumer' },
  { id: 'Healthcare', labelTh: 'โรงพยาบาล & การแพทย์', labelEn: 'Healthcare & Pharma' },
];

/**
 * Curated list of popular tags specifically for US Stocks (NYSE / NASDAQ / Dow)
 */
export const US_MARKET_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกหมวด', labelEn: 'All Tags' },
  { id: 'Magnificent 7', labelTh: '7 นางฟ้า (Magnificent 7)', labelEn: 'Magnificent 7' },
  { id: 'IPO ล่าสุด', labelTh: 'IPO ล่าสุด & หุ้นดาวเด่น', labelEn: 'Recent IPOs & Stars' },
  { id: 'Dow Jones', labelTh: 'Dow Jones', labelEn: 'Dow Jones' },
  { id: 'NASDAQ-100', labelTh: 'NASDAQ-100', labelEn: 'NASDAQ-100' },
  { id: 'S&P 500', labelTh: 'S&P 500', labelEn: 'S&P 500' },
  { id: 'Tech & AI', labelTh: 'AI & เซมิคอนดักเตอร์', labelEn: 'AI & Big Tech' },
  { id: 'High Dividend', labelTh: 'ปันผลสม่ำเสมอ', labelEn: 'Dividend Aristocrats' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Banking & Finance', labelTh: 'วอลล์สตรีท & การเงิน', labelEn: 'Wall St & Finance' },
  { id: 'Healthcare', labelTh: 'เฮลท์แคร์ & ไบโอเทค', labelEn: 'Healthcare & Biotech' },
  { id: 'Retail & Consumer', labelTh: 'ค้าปลีก & สินค้าบริโภค', labelEn: 'Consumer & Retail' },
];

/**
 * Combined list of popular tags for All Markets view
 */
export const ALL_MARKETS_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกหมวด', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย', labelEn: 'Thai 7 Giants' },
  { id: 'Magnificent 7', labelTh: '7 นางฟ้า (Magnificent 7)', labelEn: 'Magnificent 7' },
  { id: 'IPO ล่าสุด', labelTh: 'IPO ล่าสุด (US & Thai)', labelEn: 'Recent IPOs' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่', labelEn: 'SET100 Index' },
  { id: 'Dow Jones', labelTh: 'Dow Jones', labelEn: 'Dow Jones' },
  { id: 'NASDAQ-100', labelTh: 'NASDAQ-100', labelEn: 'NASDAQ-100' },
  { id: 'S&P 500', labelTh: 'S&P 500', labelEn: 'S&P 500' },
  { id: 'Tech & AI', labelTh: 'AI & เทคโนโลยี', labelEn: 'AI & Big Tech' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง', labelEn: 'High Dividend' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Banking & Finance', labelTh: 'การเงิน & ธนาคาร', labelEn: 'Banking & Finance' },
  { id: 'Energy & Power', labelTh: 'พลังงาน & สาธารณูปโภค', labelEn: 'Energy & Utilities' },
  { id: 'Healthcare', labelTh: 'การแพทย์ & สุขภาพ', labelEn: 'Healthcare & Biotech' },
];

/**
 * Magnificent 7 strictly ordered rank (1..7)
 */
export const MAG_7_ORDER: Record<string, number> = {
  'NVDA': 1,
  'AAPL': 2,
  'MSFT': 3,
  'GOOGL': 4,
  'GOOG': 4,
  'AMZN': 5,
  'META': 6,
  'TSLA': 7,
};

/**
 * Thai 7 Giants strictly ordered rank (1..8)
 */
export const THAI_7_ORDER: Record<string, number> = {
  'DELTA': 1,
  'PTT': 2,
  'AOT': 3,
  'ADVANC': 4,
  'GULF': 5,
  'KBANK': 6,
  'SCB': 7,
  'CPALL': 8,
};

/**
 * US Prominent Mega-Cap Leaders (Rank 10..45)
 */
export const US_PROMINENT_LEADERS: Record<string, number> = {
  'AMD': 10,
  'AVGO': 11,
  'PLTR': 12,
  'LLY': 13,
  'JPM': 14,
  'V': 15,
  'MA': 16,
  'COST': 17,
  'NFLX': 18,
  'CRM': 19,
  'WMT': 20,
  'ORCL': 21,
  'DIS': 22,
  'QCOM': 23,
  'INTC': 24,
  'BAC': 25,
  'KO': 26,
  'PEP': 27,
  'UNH': 28,
  'HD': 29,
  'PG': 30,
  'UBER': 31,
  'COIN': 32,
  'SOFI': 33,
  'PYPL': 34,
  'ARM': 35,
  'SMCI': 36,
  'PANW': 37,
  'CRWD': 38,
  'SNOW': 39,
  'NOW': 40,
  'SHOP': 41,
  'ISRG': 42,
  'AMAT': 43,
  'MU': 44,
  'TXN': 45,
};

/**
 * Thai Top SET50 Blue Chips (Rank 10..38)
 */
export const THAI_PROMINENT_LEADERS: Record<string, number> = {
  'BDMS': 10,
  'TRUE': 11,
  'SCC': 12,
  'BBL': 13,
  'KTB': 14,
  'CPN': 15,
  'MINT': 16,
  'PTTEP': 17,
  'TOP': 18,
  'BH': 19,
  'TTB': 20,
  'HMPRO': 21,
  'BJC': 22,
  'TU': 23,
  'BANPU': 24,
  'BTS': 25,
  'COM7': 26,
  'GPSC': 27,
  'BGRIM': 28,
  'RATCH': 29,
  'SAWAD': 30,
  'MTC': 31,
  'TIDLOR': 32,
  'INTUCH': 33,
  'CENTEL': 34,
  'KCE': 35,
  'HANA': 36,
  'CCET': 37,
  'CPF': 38,
};

/**
 * Calculates a tiered priority rank for any stock in a market context
 * Returns a lower number for higher priority (e.g. 1 is top priority)
 */
export function getStockPopularityRank(stock: { ticker: string; market: string }, marketContext: string = 'ALL'): number {
  const ticker = stock.ticker.toUpperCase();
  const market = stock.market;

  if (market === 'US') {
    if (MAG_7_ORDER[ticker]) return MAG_7_ORDER[ticker]; // 1..7
    if (US_PROMINENT_LEADERS[ticker]) return US_PROMINENT_LEADERS[ticker]; // 10..45
    if (NASDAQ_100.has(ticker)) return 60;
    if (DOW_JONES_30.has(ticker)) return 70;
    return 100;
  }

  if (market === 'SET') {
    if (THAI_7_ORDER[ticker]) return THAI_7_ORDER[ticker]; // 1..8
    if (THAI_PROMINENT_LEADERS[ticker]) return THAI_PROMINENT_LEADERS[ticker]; // 10..38
    if (SET50_TICKERS.has(ticker)) return 60;
    if (SET100_TICKERS.has(ticker)) return 75;
    return 100;
  }

  return 100;
}

/**
 * Helper to get market-scoped tag filter definitions
 */
export function getMarketScopedTagFilters(market: 'ALL' | 'SET' | 'US') {
  if (market === 'SET') return THAI_MARKET_TAG_FILTERS;
  if (market === 'US') return US_MARKET_TAG_FILTERS;
  return ALL_MARKETS_TAG_FILTERS;
}

export const POPULAR_TAG_FILTERS = ALL_MARKETS_TAG_FILTERS;



