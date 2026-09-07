/**
 * StockHomeTH - Global (US) Stock Universe Builder
 * Node.js Equivalent for build_global_universe.py
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const US_SOURCE = path.join(BASE_DIR, 'server', 'data', 'us_stocks.json');

const US_CURATED = {
  // Magnificent 7 & Mega-Cap Tech
  "NVDA":  ["NVIDIA Corporation",             "Technology & Semiconductors",   130.36, "$3.15T",  54.2, 0.08],
  "AAPL":  ["Apple Inc.",                     "Consumer Electronics & Tech",   219.97, "$3.44T",  33.8, 0.44],
  "MSFT":  ["Microsoft Corporation",          "Software & Cloud",             419.70, "$3.11T",  34.6, 0.72],
  "AMZN":  ["Amazon.com, Inc.",               "E-Commerce & Cloud AWS",       182.40, "$1.90T",  41.5, 0.0],
  "GOOGL": ["Alphabet Inc. (Google Class A)", "Internet & Digital Tech",      168.46, "$2.06T",  23.1, 0.48],
  "META":  ["Meta Platforms, Inc.",            "Social Media & AI",            512.30, "$1.30T",  25.8, 0.39],
  "TSLA":  ["Tesla, Inc.",                    "Automotive & Clean Tech",      215.80, "$688.2B", 62.4, 0.0],

  // Dow Jones Leaders
  "UNH":   ["UnitedHealth Group Inc.",        "Healthcare & Managed Care",    397.14, "$538.9B", 36.8, 1.44],
  "GS":    ["The Goldman Sachs Group, Inc.",  "Investment Banking",           485.20, "$162.0B", 14.5, 2.45],
  "V":     ["Visa Inc.",                      "Banking & Financials",         275.07, "$564.2B", 29.5, 0.75],
  "JPM":   ["JPMorgan Chase & Co.",           "Banking & Financials",         218.64, "$622.1B", 12.3, 2.10],
  
  // NASDAQ Tech
  "AVGO":  ["Broadcom Inc.",                  "Technology & Semiconductors",  157.90, "$786.4B", 68.2, 1.30],
  "COST":  ["Costco Wholesale Corporation",   "Consumer & Retail",            915.74, "$410.4B", 52.8, 0.50],
  "NFLX":  ["Netflix, Inc.",                  "Telecom & Digital Media",      685.20, "$293.8B", 43.1, 0.0],
  "AMD":   ["Advanced Micro Devices, Inc.",   "Technology & Semiconductors",  154.20, "$249.5B", 115.0, 0.0]
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

function buildGlobalUniverse(targetCount = 500) {
  console.log(`🇺🇸 Building US Stock Universe (target: ${targetCount})...`);
  const usStocks = [];
  const seen = new Set();

  for (const [ticker, [name, sector, price, mcap, pe, div]] of Object.entries(US_CURATED)) {
    if (usStocks.length >= targetCount) break;
    seen.add(ticker);
    
    const chg = parseFloat((Math.random() * (4.5 - (-3.5)) + (-3.5)).toFixed(2));
    const spark = generateSparkline(price, chg);
    
    usStocks.push({
      ticker,
      symbol: ticker,
      name,
      market: "US",
      sector,
      price,
      currency: "USD",
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
      aiInsight: `${name} (${ticker}) is a major component in the ${sector} industry.`,
      description: `${name} is listed on the US Market in the ${sector} sector.`
    });
  }

  // Save to file
  const outputData = {
    updated_at: new Date().toISOString(),
    count: usStocks.length,
    stocks: usStocks
  };
  
  fs.writeFileSync(US_SOURCE, JSON.stringify(outputData, null, 2), 'utf-8');
  console.log(`✅ Saved ${usStocks.length} US stocks to ${US_SOURCE}`);
}

buildGlobalUniverse(500);
