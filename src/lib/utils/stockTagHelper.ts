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
 * US Magnificent 7 (7 นางฟ้าสหรัฐฯ) - The 7 US Mega-Cap Tech Titans
 */
export const MAGNIFICENT_7 = new Set([
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA'
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
    } else {
      tags.push('S&P 500');
    }
  }

  // 2. Value & Dividend Tags
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
      }
      tags.push(rawTag);
    }
  }

  // Deduplicate
  const unique = Array.from(new Set(tags));

  // Enforce strict market isolation on output
  if (market === 'US') {
    return unique.filter((tg) => !tg.includes('SET') && !tg.includes('mai') && !tg.includes('นางฟ้า')).slice(0, 5);
  }
  if (market === 'SET') {
    return unique.filter((tg) => !tg.includes('Magnificent') && !tg.includes('S&P') && !tg.includes('NASDAQ') && !tg.includes('Dow')).slice(0, 5);
  }

  return unique.slice(0, 5);
}

/**
 * Curated list of popular tags specifically for Thai Stocks (SET / mai)
 */
export const THAI_MARKET_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกหมวด (All)', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย (Thai 7 Giants)', labelEn: 'Thai 7 Giants' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ (50 หุ้นใหญ่)', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่ (100 หุ้นนำ)', labelEn: 'SET100 Index' },
  { id: 'sSET / mai', labelTh: 'sSET / mai หุ้นเติบโต', labelEn: 'sSET / mai Growth' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง (High Div)', labelEn: 'High Dividend' },
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
  { id: 'ALL', labelTh: 'ทุกหมวด (All)', labelEn: 'All Tags' },
  { id: 'Magnificent 7', labelTh: 'Magnificent 7 (7 นางฟ้าบิ๊กเทค)', labelEn: 'Magnificent 7' },
  { id: 'Dow Jones', labelTh: 'Dow Jones (DJIA 30 หุ้นบลูชิพ)', labelEn: 'Dow Jones 30' },
  { id: 'NASDAQ-100', labelTh: 'NASDAQ-100 (หุ้นเทค & นวัตกรรม)', labelEn: 'NASDAQ-100 Tech' },
  { id: 'S&P 500', labelTh: 'S&P 500 (500 หุ้นชั้นนำ)', labelEn: 'S&P 500 Index' },
  { id: 'Tech & AI', labelTh: 'AI & เซมิคอนดักเตอร์', labelEn: 'AI & Big Tech' },
  { id: 'High Dividend', labelTh: 'ปันผลสม่ำเสมอ (Dividend Aristocrats)', labelEn: 'Dividend Aristocrats' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Banking & Finance', labelTh: 'วอลล์สตรีท & การเงิน', labelEn: 'Wall St & Finance' },
  { id: 'Healthcare', labelTh: 'เฮลท์แคร์ & ไบโอเทค', labelEn: 'Healthcare & Biotech' },
  { id: 'Retail & Consumer', labelTh: 'ค้าปลีก & สินค้าบริโภค', labelEn: 'Consumer & Retail' },
];

/**
 * Combined list of popular tags for All Markets view
 */
export const ALL_MARKETS_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกหมวด (All)', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย (SET)', labelEn: 'Thai 7 Giants (SET)' },
  { id: 'Magnificent 7', labelTh: 'Magnificent 7 (US)', labelEn: 'Magnificent 7 (US)' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่', labelEn: 'SET100 Index' },
  { id: 'Dow Jones', labelTh: 'Dow Jones (DJIA 30)', labelEn: 'Dow Jones (DJIA 30)' },
  { id: 'NASDAQ-100', labelTh: 'NASDAQ-100 (US)', labelEn: 'NASDAQ-100 (US)' },
  { id: 'S&P 500', labelTh: 'S&P 500 (US)', labelEn: 'S&P 500 (US)' },
  { id: 'Tech & AI', labelTh: 'AI & เทคโนโลยี', labelEn: 'AI & Big Tech' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง (High Div)', labelEn: 'High Dividend' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Banking & Finance', labelTh: 'การเงิน & ธนาคาร', labelEn: 'Banking & Finance' },
  { id: 'Energy & Power', labelTh: 'พลังงาน & สาธารณูปโภค', labelEn: 'Energy & Utilities' },
  { id: 'Healthcare', labelTh: 'การแพทย์ & สุขภาพ', labelEn: 'Healthcare & Biotech' },
];

/**
 * Helper to get market-scoped tag filter definitions
 */
export function getMarketScopedTagFilters(market: 'ALL' | 'SET' | 'US') {
  if (market === 'SET') return THAI_MARKET_TAG_FILTERS;
  if (market === 'US') return US_MARKET_TAG_FILTERS;
  return ALL_MARKETS_TAG_FILTERS;
}

export const POPULAR_TAG_FILTERS = ALL_MARKETS_TAG_FILTERS;

