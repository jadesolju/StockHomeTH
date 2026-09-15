import { bench, describe } from 'vitest';

interface IndexItem {
  symbol: string;
  name: string;
  value: number;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
  category: string;
  country: string;
  region: string;
  isPositive: boolean;
  sparklineData: number[];
  high52w?: number;
  low52w?: number;
  sellPrice?: number;
  buyPrice?: number;
  updateRound?: string;
  lastUpdated: string;
  timestamp: string;
}

const createMockValidArray = (): IndexItem[] => [
  { symbol: '^SET.BK', name: 'SET Index', value: 1400, price: 1400, change: 5, changePercent: 0.35, currency: 'THB', category: 'index', country: 'TH', region: 'thai', isPositive: true, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: '^GSPC', name: 'S&P 500', value: 5000, price: 5000, change: 10, changePercent: 0.2, currency: 'USD', category: 'index', country: 'US', region: 'global', isPositive: true, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: '^IXIC', name: 'NASDAQ', value: 16000, price: 16000, change: -20, changePercent: -0.12, currency: 'USD', category: 'index', country: 'US', region: 'global', isPositive: false, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: '^DJI', name: 'Dow Jones', value: 38000, price: 38000, change: 15, changePercent: 0.04, currency: 'USD', category: 'index', country: 'US', region: 'global', isPositive: true, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: 'GC=F', name: 'Gold Spot (USD)', value: 2500, price: 2500, change: 12, changePercent: 0.48, currency: 'USD', category: 'commodity', country: 'GLOBAL', region: 'global', isPositive: true, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: 'CL=F', name: 'Crude Oil WTI', value: 75, price: 75, change: -0.5, changePercent: -0.66, currency: 'USD', category: 'commodity', country: 'GLOBAL', region: 'global', isPositive: false, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: 'BTC-USD', name: 'Bitcoin', value: 65000, price: 65000, change: 1200, changePercent: 1.88, currency: 'USD', category: 'crypto', country: 'GLOBAL', region: 'global', isPositive: true, sparklineData: [], lastUpdated: '', timestamp: '' },
  { symbol: 'THB=X', name: 'USD / THB', value: 34.5, price: 34.5, change: -0.1, changePercent: -0.29, currency: 'THB', category: 'forex', country: 'TH', region: 'thai', isPositive: false, sparklineData: [], lastUpdated: '', timestamp: '' }
];

describe('Array vs Record Lookup Benchmark', () => {
  bench('Array.find (Current code)', () => {
    const valid = createMockValidArray();

    // Line 187
    const goldSpot1 = valid.find((v) => v.symbol === 'GC=F');

    // Line 196
    const goldSpot2 = valid.find((v) => v.symbol === 'GC=F');
    const usdThb = valid.find((v) => v.symbol === 'THB=X');

    const fxRate = usdThb && usdThb.value > 0 ? usdThb.value : 32.84;
    let realSpotPrice = goldSpot2 && goldSpot2.value > 0 ? goldSpot2.value : 4476.60;
  });

  bench('Record/Map O(1) Lookup (Optimized code)', () => {
    const valid = createMockValidArray();
    const itemMap = new Map(valid.map((v) => [v.symbol, v]));

    const goldSpot = itemMap.get('GC=F');
    const usdThb = itemMap.get('THB=X');

    const fxRate = usdThb && usdThb.value > 0 ? usdThb.value : 32.84;
    let realSpotPrice = goldSpot && goldSpot.value > 0 ? goldSpot.value : 4476.60;
  });
});
