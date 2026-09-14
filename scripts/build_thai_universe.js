/**
 * StockHomeTH - Thai Stock Universe Builder (SET / mai)
 * Node.js Equivalent for build_thai_universe.py
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BASE_DIR = path.resolve(__dirname, '..');
const THAI_SOURCE = path.join(BASE_DIR, 'server', 'data', 'thai_stocks.json');

const THAI_CURATED = {
  // Energy & Utilities
  "PTT":    ["PTT Public Company Limited",             "Energy & Utilities",         34.50, "985.4B THB", 9.8,  6.2],
  "PTTEP":  ["PTT Exploration and Production PCL",     "Energy & Utilities",        138.50, "549.8B THB", 7.2,  6.8],
  "TOP":    ["Thai Oil Public Company Limited",        "Energy & Utilities",         48.75, "108.9B THB", 6.8,  7.5],
  "GULF":   ["Gulf Energy Development PCL",            "Energy & Utilities",         66.50, "780.3B THB", 44.2, 1.3],
  "OR":     ["PTT Oil and Retail Business PCL",        "Energy & Utilities",         16.40, "196.8B THB", 17.5, 3.5],
  
  // Banking & Financials
  "KBANK":  ["Kasikornbank Public Company Limited",    "Banking & Financials",      154.50, "366.0B THB", 8.5,  5.8],
  "SCB":    ["SCB X Public Company Limited",           "Banking & Financials",      114.00, "383.9B THB", 9.1,  8.9],
  "BBL":    ["Bangkok Bank Public Company Limited",    "Banking & Financials",      152.00, "290.1B THB", 7.2,  5.9],
  
  // Commerce & Retail
  "CPALL":  ["CP ALL Public Company Limited",          "Commerce & Retail",          64.75, "581.6B THB", 28.4, 2.1],
  "CRC":    ["Central Retail Corporation PCL",         "Commerce & Retail",          32.00, "193.0B THB", 24.2, 2.2],

  // Technology & Electronics
  "DELTA":  ["Delta Electronics (Thailand) PCL",       "Electronics & Tech",        142.00, "1.77T THB",  72.1, 0.6],
  
  // Telecom & Digital
  "ADVANC": ["Advanced Info Service PCL (AIS)",        "Telecom & Digital",         285.00, "847.7B THB", 24.5, 3.8],
  
  // Healthcare
  "BDMS":   ["Bangkok Dusit Medical Services PCL",     "Healthcare & Hospitals",     27.50, "437.0B THB", 29.8, 2.9],
  "BH":     ["Bumrungrad Hospital PCL",                "Healthcare & Hospitals",    268.00, "213.0B THB", 27.5, 2.0],
  
  // Transportation
  "AOT":    ["Airports of Thailand PCL",               "Transportation & Logistics", 61.25, "875.0B THB", 36.2, 1.8],
  
  // Property
  "CPN":    ["Central Pattana PCL",                    "Property & Real Estate",     63.50, "284.9B THB", 18.9, 2.8],
  
  // Construction
  "SCC":    ["The Siam Cement PCL",                    "Construction & Materials",  218.00, "261.6B THB", 32.0, 3.2],
  
  // Tourism & Food
  "MINT":   ["Minor International PCL",                "Tourism & Hospitality",      28.50, "127.4B THB", 38.5, 1.5],
  "CPF":    ["Charoen Pokphand Foods PCL",             "Food & Beverage",            24.20, "208.4B THB", 18.0, 3.2]
};

function generateSparkline(basePrice, changePct) {
  const points = [];
  let curr = basePrice * (1.0 - (changePct / 100.0));
  const vol = Math.max(0.008, Math.abs(changePct) / 100.0 * 0.4);
  for (let i = 0; i < 6; i++) {
    curr += (Math.random() - 0.48) * vol * curr;
    points.push(parseFloat(curr.toFixed(2)));
  }
  points.push(parseFloat(basePrice.toFixed(2)));
  return points;
}

function buildThaiUniverse(targetCount = 805) {
  console.log(`🇹🇭 Building Thai Stock Universe (target: ${targetCount})...`);
  const thaiStocks = [];
  const seen = new Set();

  let catalogStocks = [];
  if (fs.existsSync(THAI_SOURCE)) {
    try {
      const srcData = JSON.parse(fs.readFileSync(THAI_SOURCE, 'utf-8'));
      catalogStocks = Array.isArray(srcData) ? srcData : (srcData.stocks || []);
    } catch (err) {
      console.warn('Warning loading THAI_SOURCE in JS builder:', err);
    }
  }

  for (const [ticker, [name, sector, price, mcap, pe, div]] of Object.entries(THAI_CURATED)) {
    if (thaiStocks.length >= targetCount) break;
    seen.add(ticker);
    
    const chg = parseFloat((Math.random() * (4.5 - (-3.5)) + (-3.5)).toFixed(2));
    const spark = generateSparkline(price, chg);
    
    thaiStocks.push({
      ticker,
      symbol: `${ticker}.BK`,
      name,
      market: "SET",
      sector,
      price,
      currency: "THB",
      change: chg,
      changeAmount: parseFloat((price * (chg / 100)).toFixed(2)),
      marketCap: mcap,
      peRatio: pe,
      dividendYield: div,
      high52w: parseFloat((price * (1.10 + Math.random() * 0.25)).toFixed(2)),
      low52w: parseFloat((price * (0.70 + Math.random() * 0.20)).toFixed(2)),
      volume: `${(5.0 + Math.random() * 80.0).toFixed(1)}M`,
      sparkline7d: spark,
      analystRating: chg >= 2.0 ? "Strong Buy" : chg >= 0 ? "Buy" : "Hold",
      targetPrice: parseFloat((price * (1.08 + Math.random() * 0.17)).toFixed(2)),
      sentimentScore: Math.min(98, Math.max(20, Math.floor(70 + chg * 5))),
      aiInsight: `หุ้น ${name} (${ticker}) ผู้นำในกลุ่ม ${sector} ปัจจัยพื้นฐานแข็งแกร่ง`,
      description: `${name} จดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทย (SET) หมวด ${sector}`
    });
  }

  for (const item of catalogStocks) {
    if (thaiStocks.length >= targetCount) break;
    const tk = (item.ticker || (item.symbol ? item.symbol.replace('.BK', '') : '')).trim().toUpperCase();
    if (!tk || seen.has(tk)) continue;
    seen.add(tk);

    const pr = parseFloat((item.price || (2.5 + Math.random() * 42.5)).toFixed(2));
    const chg = parseFloat((item.change || (Math.random() * 8.0 - 4.0)).toFixed(2));
    const spark = generateSparkline(pr, chg);
    const nm = item.name || `${tk} Public Company Limited`;
    const sec = item.sector || "Industrial & Services";

    thaiStocks.push({
      ticker: tk,
      symbol: `${tk}.BK`,
      name: nm,
      market: "SET",
      sector: sec,
      price: pr,
      currency: "THB",
      change: chg,
      changeAmount: parseFloat((pr * (chg / 100)).toFixed(2)),
      marketCap: item.marketCap || `${(2.0 + Math.random() * 45.0).toFixed(1)}B THB`,
      peRatio: parseFloat((item.peRatio || (8.0 + Math.random() * 24.0)).toFixed(1)),
      dividendYield: parseFloat((item.dividendYield || (1.5 + Math.random() * 6.0)).toFixed(1)),
      high52w: parseFloat((pr * (1.10 + Math.random() * 0.25)).toFixed(2)),
      low52w: parseFloat((pr * (0.70 + Math.random() * 0.20)).toFixed(2)),
      volume: `${(1.0 + Math.random() * 35.0).toFixed(1)}M`,
      sparkline7d: spark,
      analystRating: chg > 0 ? "Buy" : "Hold",
      targetPrice: parseFloat((pr * 1.15).toFixed(2)),
      sentimentScore: Math.min(95, Math.max(30, Math.floor(65 + chg * 5))),
      aiInsight: `หุ้น ${nm} (${tk}) ดำเนินธุรกิจในกลุ่ม ${sec}`,
      description: `${nm} (${tk}) บริษัทจดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทย (SET/mai)`
    });
  }

  // Save to file
  const outputData = {
    updated_at: new Date().toISOString(),
    count: thaiStocks.length,
    stocks: thaiStocks
  };
  
  fs.writeFileSync(THAI_SOURCE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Saved ${thaiStocks.length} Thai stocks to ${THAI_SOURCE}`);
}

buildThaiUniverse(805);
