import { z } from 'zod';
import { MarketRegionSchema, SentimentTypeSchema, type MarketRegion, type SentimentType } from './marketSchema';

export { MarketRegionSchema, SentimentTypeSchema, type MarketRegion, type SentimentType };

export const TimeframeTypeSchema = z.enum(['daily', 'weekly']);
export type TimeframeType = z.infer<typeof TimeframeTypeSchema>;

export const NewsCategorySchema = z.enum([
  'all',
  'macro',
  'tech',
  'energy',
  'finance',
  'retail',
  'telecom',
  'realestate',
  'health',
]);
export type NewsCategory = z.infer<typeof NewsCategorySchema>;

export const ImpactAnalysisSchema = z.object({
  bullishReason: z.string().optional(),
  bearishReason: z.string().optional(),
  targetSector: z.string().optional(),
  priceTrendOutlook: z.string().optional(),
  riskFactors: z.array(z.string()).optional(),
});
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;

export const StockNewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  keyTakeaways: z.array(z.string()).min(1),
  fullContent: z.string(),
  region: MarketRegionSchema,
  timeframe: TimeframeTypeSchema,
  marketName: z.string(),
  date: z.string(),
  time: z.string().optional(),
  periodLabel: z.string(),
  sentiment: SentimentTypeSchema,
  tickers: z.array(z.string()).min(1),
  readTime: z.string(),
  audioDuration: z.string().optional(),
  source: z.string(),
  category: NewsCategorySchema,
  impactAnalysis: ImpactAnalysisSchema,
  isFeatured: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
});
export type StockNewsItem = z.infer<typeof StockNewsItemSchema>;

export const DigestSummarySchema = z.object({
  id: z.string().min(1),
  periodLabel: z.string(),
  timeframe: TimeframeTypeSchema,
  region: z.enum(['all', 'thai', 'global']),
  mainHeadline: z.string(),
  overviewSummary: z.string(),
  marketSentimentScore: z.object({
    bullishPercent: z.number().min(0).max(100),
    bearishPercent: z.number().min(0).max(100),
    neutralPercent: z.number().min(0).max(100),
  }),
  keyCatalysts: z.array(z.string()),
  topWatchlistTickers: z.array(z.string()),
  updatedAt: z.string(),
});
export type DigestSummary = z.infer<typeof DigestSummarySchema>;
