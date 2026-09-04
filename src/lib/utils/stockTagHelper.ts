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
  'BYD', 'CHG', 'CK', 'CKP', 'DOHOME', 'ERW', 'FORTH', 'GFPT', 'HANA', 'ICHI',
  'ITC', 'JAS', 'JMART', 'JMT', 'KAMART', 'MEGA', 'MOSHI', 'NEX', 'PLANB', 'PRM',
  'PSL', 'PTG', 'QH', 'RCL', 'SAPPE', 'SCCC', 'SJWD', 'SIRI', 'SPALI', 'SPRC',
  'STA', 'STEC', 'STGT', 'TASCO', 'THANI', 'TKN', 'TLI', 'TPIPL', 'TPIPP', 'TTW',
  'VGI', 'WHAUP', 'XO'
]);

/**
 * US Magnificent 7 (7 นางฟ้าสหรัฐฯ) - The 7 US Mega-Cap Tech Titans
 */
export const MAGNIFICENT_7 = new Set([
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'META', 'TSLA'
]);

export const SP500_TECH = new Set([
  'NVDA', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'AMD', 'AVGO', 'QCOM',
  'INTC', 'CRM', 'ADBE', 'PLTR', 'SNOW', 'CRWD', 'ORCL', 'CSCO', 'IBM', 'NOW',
  'NFLX', 'PANW'
]);

export const SP500_FINANCE = new Set([
  'JPM', 'BAC', 'WFC', 'C', 'GS', 'MS', 'BLK', 'V', 'MA', 'AXP', 'BRK.B', 'PYPL'
]);

export const SP500_HEALTH = new Set([
  'LLY', 'NVO', 'UNH', 'JNJ', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'BMY', 'AMGN'
]);

export const DIVIDEND_ARISTOCRATS = new Set([
  'JNJ', 'PG', 'KO', 'PEP', 'MCD', 'XOM', 'CVX', 'ABBV', 'IBM', 'MMM', 'T', 'VZ',
  'O', 'LOW', 'CL', 'EMR', 'ADVANC', 'PTT', 'SCB', 'BBL', 'KBANK', 'TTB', 'LH', 'SPALI',
  'TISCO', 'TCAP', 'SIRI', 'ORI'
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
      tags.push('sSET');
    }
  } else {
    tags.push('US Market');
    if (MAGNIFICENT_7.has(t)) {
      tags.push('Magnificent 7');
      tags.push('AI Leader');
    }
    if (SP500_TECH.has(t)) {
      tags.push('Tech & AI');
      tags.push('NASDAQ-100');
      tags.push('S&P 500');
    } else {
      tags.push('S&P 500');
    }
  }

  // 2. Value & Dividend Tags
  if (stock.dividendYield >= 3.5 || DIVIDEND_ARISTOCRATS.has(t)) {
    tags.push('High Dividend');
  }
  if (stock.peRatio > 0 && stock.peRatio <= 15) {
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
  } else if (sec.includes('health') || sec.includes('pharma') || sec.includes('hospital')) {
    tags.push('Healthcare');
  } else if (sec.includes('consumer') || sec.includes('retail') || sec.includes('commerce') || sec.includes('food')) {
    tags.push('Retail & Consumer');
  } else if (sec.includes('auto') || sec.includes('ev') || sec.includes('transport') || sec.includes('logistic')) {
    tags.push('EV & Mobility');
  } else if (sec.includes('telecom') || sec.includes('communication') || sec.includes('digital')) {
    tags.push('Telecom');
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
        if (rawTag.includes('Magnificent') || rawTag.includes('S&P') || rawTag.includes('NASDAQ') || rawTag.includes('US Market')) {
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
    return unique.filter((tg) => !tg.includes('Magnificent') && !tg.includes('S&P') && !tg.includes('NASDAQ')).slice(0, 5);
  }

  return unique.slice(0, 5);
}

/**
 * Curated list of popular tags specifically for Thai Stocks (SET / mai)
 */
export const THAI_MARKET_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกแท็ก (All)', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย (Thai 7 Giants)', labelEn: 'Thai 7 Giants' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ (50 หุ้นใหญ่)', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่ (100 หุ้นนำ)', labelEn: 'SET100 Index' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง (High Div)', labelEn: 'High Dividend' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Energy & Power', labelTh: 'พลังงาน & สาธารณูปโภค', labelEn: 'Energy & Utilities' },
  { id: 'Banking & Finance', labelTh: 'การเงิน & ธนาคาร', labelEn: 'Banking & Finance' },
  { id: 'Retail & Consumer', labelTh: 'ค้าปลีก & ท่องเที่ยว', labelEn: 'Retail & Consumer' },
  { id: 'Healthcare', labelTh: 'โรงพยาบาล & การแพทย์', labelEn: 'Healthcare & Pharma' },
];

/**
 * Curated list of popular tags specifically for US Stocks (NYSE / NASDAQ)
 */
export const US_MARKET_TAG_FILTERS = [
  { id: 'ALL', labelTh: 'ทุกแท็ก (All)', labelEn: 'All Tags' },
  { id: 'Magnificent 7', labelTh: 'Magnificent 7 (7 นางฟ้าสหรัฐฯ)', labelEn: 'Magnificent 7' },
  { id: 'Tech & AI', labelTh: 'AI & เซมิคอนดักเตอร์', labelEn: 'AI & Big Tech' },
  { id: 'S&P 500', labelTh: 'S&P 500 หุ้นใหญ่', labelEn: 'S&P 500 Index' },
  { id: 'NASDAQ-100', labelTh: 'NASDAQ-100 เทค', labelEn: 'NASDAQ-100' },
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
  { id: 'ALL', labelTh: 'ทุกแท็ก (All)', labelEn: 'All Tags' },
  { id: '7 นางฟ้าหุ้นไทย', labelTh: '7 นางฟ้าหุ้นไทย (SET)', labelEn: 'Thai 7 Giants (SET)' },
  { id: 'Magnificent 7', labelTh: 'Magnificent 7 (US)', labelEn: 'Magnificent 7 (US)' },
  { id: 'SET50', labelTh: 'SET50 บลูชิพ', labelEn: 'SET50 Blue Chips' },
  { id: 'SET100', labelTh: 'SET100 หุ้นใหญ่', labelEn: 'SET100 Index' },
  { id: 'Tech & AI', labelTh: 'AI & เทคโนโลยี', labelEn: 'AI & Big Tech' },
  { id: 'High Dividend', labelTh: 'ปันผลสูง (High Div)', labelEn: 'High Dividend' },
  { id: 'Value Play', labelTh: 'หุ้นคุณค่า (Value P/E ต่ำ)', labelEn: 'Value Play (Low P/E)' },
  { id: 'Energy & Power', labelTh: 'พลังงาน & สาธารณูปโภค', labelEn: 'Energy & Utilities' },
  { id: 'Banking & Finance', labelTh: 'การเงิน & ธนาคาร', labelEn: 'Banking & Finance' },
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
