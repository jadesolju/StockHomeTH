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
  bullishReason_th?: string;
  bullishReason_en?: string;
  bearishReason?: string;
  bearishReason_th?: string;
  bearishReason_en?: string;
  targetSector?: string;
  targetSector_th?: string;
  targetSector_en?: string;
  priceTrendOutlook?: string;
  priceTrendOutlook_th?: string;
  priceTrendOutlook_en?: string;
  riskFactors?: string[];
  riskFactors_th?: string[];
  riskFactors_en?: string[];
}

export interface StockNewsItem {
  id: string;
  title: string;
  title_th?: string;
  title_en?: string;
  summary: string;
  summary_th?: string;
  summary_en?: string;
  keyTakeaways: string[];
  keyTakeaways_th?: string[];
  keyTakeaways_en?: string[];
  fullContent: string;
  fullContent_th?: string;
  fullContent_en?: string;
  region: 'thai' | 'global';
  timeframe: TimeframeType;
  marketName: string; // e.g. 'SET Index', 'SET50', 'NASDAQ', 'S&P 500', 'NYSE'
  date: string;       // e.g. '27 ส.ค. 2026'
  time?: string;      // e.g. '18:30 น.'
  periodLabel: string; // e.g. 'ประจำวันที่ 27 ส.ค. 2026' หรือ 'ประจำสัปดาห์ที่ 4 ส.ค. 2026'
  periodLabel_th?: string;
  periodLabel_en?: string;
  sentiment: SentimentType;
  tickers: string[];  // e.g. ['PTT', 'BDMS'], ['NVDA', 'AAPL']
  readTime: string;   // e.g. '3 นาที'
  audioDuration?: string; // Optional (audio purged)
  source: string;
  category: NewsCategory;
  impactAnalysis: ImpactAnalysis;
  isFeatured?: boolean;
  isBookmarked?: boolean;
  link?: string;
  url?: string;
  sourceUrl?: string;
}

export interface DailyWeeklyDigestSummary {
  id: string;
  periodLabel: string;
  periodLabel_th?: string;
  periodLabel_en?: string;
  timeframe: TimeframeType;
  region: MarketRegion;
  mainHeadline: string;
  mainHeadline_th?: string;
  mainHeadline_en?: string;
  overviewSummary: string;
  overviewSummary_th?: string;
  overviewSummary_en?: string;
  marketSentimentScore: {
    bullishPercent: number;
    bearishPercent: number;
    neutralPercent: number;
  };
  keyCatalysts: (string | { text: string; text_th?: string; text_en?: string; newsId?: string })[];
  keyCatalysts_th?: string[];
  keyCatalysts_en?: string[];
  thaiCatalysts?: (string | { text: string; text_th?: string; text_en?: string; newsId?: string })[];
  thaiCatalysts_th?: string[];
  thaiCatalysts_en?: string[];
  thaiCatalystsItems?: { text: string; text_th?: string; text_en?: string; newsId?: string }[];
  usCatalysts?: (string | { text: string; text_th?: string; text_en?: string; newsId?: string })[];
  usCatalysts_th?: string[];
  usCatalysts_en?: string[];
  usCatalystsItems?: { text: string; text_th?: string; text_en?: string; newsId?: string }[];
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
