/**
 * Types definition for Stock News Summary Application
 * รองรับสรุปข่าวหุ้นไทย และ หุ้นต่างประเทศ ทั้งแบบ รายวัน (Daily) และ รายสัปดาห์ (Weekly)
 */

export type MarketRegion = 'all' | 'thai' | 'global';

export type TimeframeType = 'daily' | 'weekly';

export type SentimentType = 'bullish' | 'bearish' | 'neutral';

export type NewsCategory = 
  | 'all' 
  | 'macro' 
  | 'tech' 
  | 'energy' 
  | 'finance' 
  | 'retail' 
  | 'telecom' 
  | 'realestate'
  | 'health';

export interface ImpactAnalysis {
  bullishReason?: string;
  bearishReason?: string;
  targetSector?: string;
  priceTrendOutlook?: string;
  riskFactors?: string[];
}

export interface StockNewsItem {
  id: string;
  title: string;
  summary: string;
  keyTakeaways: string[];
  fullContent: string;
  region: 'thai' | 'global';
  timeframe: TimeframeType;
  marketName: string; // e.g. 'SET Index', 'SET50', 'NASDAQ', 'S&P 500', 'NYSE'
  date: string;       // e.g. '27 ส.ค. 2026'
  time?: string;      // e.g. '18:30 น.'
  periodLabel: string; // e.g. 'ประจำวันที่ 27 ส.ค. 2026' หรือ 'ประจำสัปดาห์ที่ 4 ส.ค. 2026'
  sentiment: SentimentType;
  tickers: string[];  // e.g. ['PTT', 'BDMS'], ['NVDA', 'AAPL']
  readTime: string;   // e.g. '3 นาที'
  audioDuration: string; // e.g. '1:45'
  source: string;
  category: NewsCategory;
  impactAnalysis: ImpactAnalysis;
  isFeatured?: boolean;
  isBookmarked?: boolean;
}

export interface DailyWeeklyDigestSummary {
  id: string;
  periodLabel: string;
  timeframe: TimeframeType;
  region: MarketRegion;
  mainHeadline: string;
  overviewSummary: string;
  marketSentimentScore: {
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
  };
  keyCatalysts: string[];
  topWatchlistTickers: string[];
  updatedAt: string;
}

export interface NewsFilterOptions {
  region: MarketRegion;
  timeframe: TimeframeType;
  sentiment: 'all' | SentimentType;
  category: NewsCategory;
  searchQuery: string;
}
