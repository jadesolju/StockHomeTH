export interface ThaiGoldData {
  symbol: string;
  name: string;
  value: number;
  price: number;
  sellPrice: number;
  buyPrice: number;
  ornamentSellPrice?: number;
  ornamentBuyPrice?: number;
  change: number;
  changePercent: number;
  currency: string;
  category: string;
  country: string;
  region: string;
  isPositive: boolean;
  sparklineData: number[];
  updateRound: string;
  lastUpdated: string;
  timestamp: string;
  source: 'official_goldtraders' | 'chnwt_api' | 'calculated_fallback';
}

/**
 * Scrapes official Thai Gold Traders Association website (classic.goldtraders.or.th)
 */
export async function fetchOfficialThaiGold(): Promise<ThaiGoldData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://classic.goldtraders.or.th/', {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      const sellMatch = html.match(
        /id="DetailPlace_uc_goldprices1_lblBLSell"[\s\S]*?>([\d,]+\.?\d*)</i
      );
      const buyMatch = html.match(
        /id="DetailPlace_uc_goldprices1_lblBLBuy"[\s\S]*?>([\d,]+\.?\d*)</i
      );
      const timeMatch = html.match(
        /id="DetailPlace_uc_goldprices1_lblAsTime"[\s\S]*?>([^<]+)</i
      );

      if (sellMatch && sellMatch[1]) {
        const sell = parseFloat(sellMatch[1].replace(/,/g, '')) || 0;
        const buy = buyMatch
          ? parseFloat(buyMatch[1].replace(/,/g, '')) || sell - 100
          : sell - 100;
        const updateTime = timeMatch ? timeMatch[1].trim() : 'สมาคมค้าทองคำ';

        if (sell > 0) {
          return {
            symbol: 'GOLD_THAI',
            name: 'ทองคำแท่ง 96.5% (สมาคม)',
            value: sell,
            price: sell,
            sellPrice: sell,
            buyPrice: buy,
            change: 0,
            changePercent: 0,
            currency: 'THB',
            category: 'gold_thai',
            country: 'TH',
            region: 'thai',
            isPositive: true,
            sparklineData: [sell - 100, sell - 50, sell],
            updateRound: updateTime,
            lastUpdated: updateTime,
            timestamp: new Date().toISOString(),
            source: 'official_goldtraders',
          };
        }
      }
    }
  } catch (err) {
    console.warn('[thaiGoldService] GoldTraders scrape failed:', err);
  }

  // Fallback to secondary API (chnwt.dev)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.chnwt.dev/thai-gold-api/latest', {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 60 },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      if (json?.status === 'success' && json?.response?.price?.gold_bar) {
        const bar = json.response.price.gold_bar;
        const sell = parseFloat(String(bar.sell).replace(/,/g, '')) || 0;
        const buy =
          parseFloat(String(bar.buy).replace(/,/g, '')) || sell - 100;
        const updateTime = json.response.update_time || 'สมาคมค้าทองคำ';

        const ornament = json.response.price.gold;
        const ornamentSell = ornament?.sell
          ? parseFloat(String(ornament.sell).replace(/,/g, ''))
          : undefined;
        const ornamentBuy = ornament?.buy
          ? parseFloat(String(ornament.buy).replace(/,/g, ''))
          : undefined;

        if (sell > 0) {
          return {
            symbol: 'GOLD_THAI',
            name: 'ทองคำแท่ง 96.5% (สมาคม)',
            value: sell,
            price: sell,
            sellPrice: sell,
            buyPrice: buy,
            ornamentSellPrice: ornamentSell,
            ornamentBuyPrice: ornamentBuy,
            change: 0,
            changePercent: 0,
            currency: 'THB',
            category: 'gold_thai',
            country: 'TH',
            region: 'thai',
            isPositive: true,
            sparklineData: [sell * 0.995, sell * 0.998, sell],
            updateRound: updateTime,
            lastUpdated: updateTime,
            timestamp: new Date().toISOString(),
            source: 'chnwt_api',
          };
        }
      }
    }
  } catch (err) {
    console.warn('[thaiGoldService] Chnwt API failed:', err);
  }

  return null;
}

/**
 * High-precision Thai Gold Traders Association calculation fallback
 */
export function calculateFallbackThaiGold(spotPriceUsd = 4476.60, thbFxRate = 32.84): ThaiGoldData {
  const rawThaiGold = Math.round(((spotPriceUsd / 31.1035) * 15.244 * 0.965 * thbFxRate) + 350);
  const roundedBarPrice = Math.round(rawThaiGold / 50) * 50;
  const updateTime = `คำนวณจาก Spot $${spotPriceUsd.toFixed(2)} • THB/USD ${thbFxRate.toFixed(2)}`;

  return {
    symbol: 'GOLD_THAI',
    name: 'ทองคำแท่ง 96.5% (สมาคม)',
    value: roundedBarPrice,
    price: roundedBarPrice,
    sellPrice: roundedBarPrice,
    buyPrice: roundedBarPrice - 100,
    change: 0,
    changePercent: 0,
    currency: 'THB',
    category: 'gold_thai',
    country: 'TH',
    region: 'thai',
    isPositive: true,
    sparklineData: [roundedBarPrice - 150, roundedBarPrice - 50, roundedBarPrice],
    updateRound: updateTime,
    lastUpdated: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
    timestamp: new Date().toISOString(),
    source: 'calculated_fallback',
  };
}

/**
 * Gets live Thai Gold price, with automatic fallback handling
 */
export async function getLiveThaiGoldPrice(spotPriceUsd?: number, thbFxRate?: number): Promise<ThaiGoldData> {
  const live = await fetchOfficialThaiGold();
  if (live) return live;
  return calculateFallbackThaiGold(spotPriceUsd, thbFxRate);
}
