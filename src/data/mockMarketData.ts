import type { MarketIndex, StockQuote, SectorPerformance } from '../types/market';

export const mockMarketIndices: MarketIndex[] = [
  {
    symbol: 'SET',
    name: 'SET Index',
    value: 1458.20,
    change: 11.45,
    changePercent: 0.79,
    region: 'thai',
    isPositive: true,
    sparklineData: [1442, 1445, 1443, 1450, 1452, 1455, 1458.2],
    lastUpdated: '16:45 น.'
  },
  {
    symbol: 'SET50',
    name: 'SET50 Index',
    value: 898.40,
    change: 7.10,
    changePercent: 0.80,
    region: 'thai',
    isPositive: true,
    sparklineData: [890, 891, 889, 893, 895, 896, 898.4],
    lastUpdated: '16:45 น.'
  },
  {
    symbol: 'MAI',
    name: 'mai Index',
    value: 342.10,
    change: -1.20,
    changePercent: -0.35,
    region: 'thai',
    isPositive: false,
    sparklineData: [344, 344.5, 343.8, 343, 342.5, 342.1],
    lastUpdated: '16:45 น.'
  },
  {
    symbol: 'IXIC',
    name: 'NASDAQ Composite',
    value: 17890.20,
    change: 165.40,
    changePercent: 0.93,
    region: 'global',
    isPositive: true,
    sparklineData: [17680, 17720, 17750, 17810, 17850, 17890.2],
    lastUpdated: '04:00 น. (ปิดตลาด)'
  },
  {
    symbol: 'GSPC',
    name: 'S&P 500',
    value: 5610.80,
    change: 32.50,
    changePercent: 0.58,
    region: 'global',
    isPositive: true,
    sparklineData: [5565, 5578, 5585, 5592, 5602, 5610.8],
    lastUpdated: '04:00 น. (ปิดตลาด)'
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones',
    value: 41200.10,
    change: 45.20,
    changePercent: 0.11,
    region: 'global',
    isPositive: true,
    sparklineData: [41120, 41140, 41160, 41180, 41200.1],
    lastUpdated: '04:00 น. (ปิดตลาด)'
  },
  {
    symbol: 'N225',
    name: 'Nikkei 225',
    value: 38450.00,
    change: 280.10,
    changePercent: 0.73,
    region: 'global',
    isPositive: true,
    sparklineData: [38100, 38220, 38180, 38350, 38450],
    lastUpdated: '13:00 น.'
  }
];

export const mockStockQuotes: StockQuote[] = [
  {
    symbol: 'PTT',
    name: 'บริษัท ปตท. จำกัด (มหาชน)',
    price: 34.50,
    change: 0.75,
    changePercent: 2.22,
    market: 'SET',
    region: 'thai',
    sector: 'พลังงาน & สาธารณูปโภค',
    peRatio: 9.8,
    marketCap: '985,400 ล้านบาท',
    sentiment: 'bullish'
  },
  {
    symbol: 'DELTA',
    name: 'บริษัท เดลต้า อีเลคโทรนิคส์ (ประเทศไทย)',
    price: 104.50,
    change: 3.50,
    changePercent: 3.47,
    market: 'SET',
    region: 'thai',
    sector: 'เทคโนโลยี',
    peRatio: 62.4,
    marketCap: '1,303,500 ล้านบาท',
    sentiment: 'bullish'
  },
  {
    symbol: 'BDMS',
    name: 'บริษัท กรุงเทพดุสิตเวชการ จำกัด (มหาชน)',
    price: 28.00,
    change: -0.25,
    changePercent: -0.88,
    market: 'SET',
    region: 'thai',
    sector: 'การแพทย์',
    peRatio: 31.2,
    marketCap: '445,000 ล้านบาท',
    sentiment: 'neutral'
  },
  {
    symbol: 'CPALL',
    name: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)',
    price: 64.75,
    change: 1.25,
    changePercent: 1.97,
    market: 'SET',
    region: 'thai',
    sector: 'พาณิชย์',
    peRatio: 28.5,
    marketCap: '581,600 ล้านบาท',
    sentiment: 'bullish'
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    price: 128.50,
    change: 4.80,
    changePercent: 3.88,
    market: 'NASDAQ',
    region: 'global',
    sector: 'Semiconductors & AI',
    peRatio: 48.2,
    marketCap: '$3.15 Trillion',
    sentiment: 'bullish'
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    price: 226.40,
    change: 1.80,
    changePercent: 0.80,
    market: 'NASDAQ',
    region: 'global',
    sector: 'Consumer Electronics',
    peRatio: 33.1,
    marketCap: '$3.45 Trillion',
    sentiment: 'bullish'
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    price: 212.10,
    change: -4.30,
    changePercent: -1.99,
    market: 'NASDAQ',
    region: 'global',
    sector: 'Automotive & Clean Energy',
    peRatio: 58.6,
    marketCap: '$675 Billion',
    sentiment: 'bearish'
  }
];

export const mockSectors: SectorPerformance[] = [
  { id: '1', name: 'พลังงาน (Energy)', changePercent: 1.85, region: 'thai', topGainer: 'PTT (+2.22%)' },
  { id: '2', name: 'อิเล็กทรอนิกส์ (ETRON)', changePercent: 3.12, region: 'thai', topGainer: 'DELTA (+3.47%)' },
  { id: '3', name: 'เทคโนโลยีโลก (US Tech)', changePercent: 1.42, region: 'global', topGainer: 'NVDA (+3.88%)' },
  { id: '4', name: 'การเงิน & ธนาคาร (Banking)', changePercent: 0.45, region: 'thai', topGainer: 'KBANK (+0.95%)' },
  { id: '5', name: 'ยานยนต์ไฟฟ้า (EV Sector)', changePercent: -1.20, region: 'global', topGainer: 'BYD (+0.80%)' },
];
