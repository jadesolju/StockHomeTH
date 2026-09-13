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
  bullishReason_th: z.string().optional(),
  bullishReason_en: z.string().optional(),
  bearishReason: z.string().optional(),
  bearishReason_th: z.string().optional(),
  bearishReason_en: z.string().optional(),
  targetSector: z.string().optional(),
  targetSector_th: z.string().optional(),
  targetSector_en: z.string().optional(),
  priceTrendOutlook: z.string().optional(),
  priceTrendOutlook_th: z.string().optional(),
  priceTrendOutlook_en: z.string().optional(),
  riskFactors: z.array(z.string()).optional(),
  riskFactors_th: z.array(z.string()).optional(),
  riskFactors_en: z.array(z.string()).optional(),
});
export type ImpactAnalysis = z.infer<typeof ImpactAnalysisSchema>;

export const StockNewsItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  title_th: z.string().optional(),
  title_en: z.string().optional(),
  summary: z.string().min(1),
  summary_th: z.string().optional(),
  summary_en: z.string().optional(),
  keyTakeaways: z.array(z.string()).min(1),
  keyTakeaways_th: z.array(z.string()).optional(),
  keyTakeaways_en: z.array(z.string()).optional(),
  fullContent: z.string(),
  fullContent_th: z.string().optional(),
  fullContent_en: z.string().optional(),
  region: MarketRegionSchema,
  timeframe: TimeframeTypeSchema,
  marketName: z.string(),
  date: z.string(),
  time: z.string().optional(),
  periodLabel: z.string(),
  periodLabel_th: z.string().optional(),
  periodLabel_en: z.string().optional(),
  sentiment: SentimentTypeSchema,
  tickers: z.array(z.string()).min(1),
  readTime: z.string(),
  audioDuration: z.string().optional(),
  source: z.string(),
  category: NewsCategorySchema,
  impactAnalysis: ImpactAnalysisSchema,
  isFeatured: z.boolean().optional(),
  isBookmarked: z.boolean().optional(),
  relevanceScore: z.number().min(0).max(100).optional(),
  link: z.string().optional(),
  url: z.string().optional(),
  sourceUrl: z.string().optional(),
});
export type StockNewsItem = z.infer<typeof StockNewsItemSchema>;

export const CatalystItemSchema = z.object({
  text: z.string(),
  text_th: z.string().optional(),
  text_en: z.string().optional(),
  newsId: z.string().optional(),
});
export type CatalystItem = z.infer<typeof CatalystItemSchema>;

export const DigestSummarySchema = z.object({
  id: z.string().min(1),
  periodLabel: z.string(),
  periodLabel_th: z.string().optional(),
  periodLabel_en: z.string().optional(),
  timeframe: TimeframeTypeSchema,
  region: z.enum(['all', 'thai', 'global']),
  mainHeadline: z.string(),
  mainHeadline_th: z.string().optional(),
  mainHeadline_en: z.string().optional(),
  overviewSummary: z.string(),
  overviewSummary_th: z.string().optional(),
  overviewSummary_en: z.string().optional(),
  marketSentimentScore: z.object({
    bullishPercent: z.number().min(0).max(100),
    bearishPercent: z.number().min(0).max(100),
    neutralPercent: z.number().min(0).max(100),
  }),
  keyCatalysts: z.array(z.union([z.string(), CatalystItemSchema])),
  keyCatalysts_th: z.array(z.string()).optional(),
  keyCatalysts_en: z.array(z.string()).optional(),
  thaiCatalysts: z.array(z.union([z.string(), CatalystItemSchema])).optional(),
  thaiCatalysts_th: z.array(z.string()).optional(),
  thaiCatalysts_en: z.array(z.string()).optional(),
  thaiCatalystsItems: z.array(CatalystItemSchema).optional(),
  usCatalysts: z.array(z.union([z.string(), CatalystItemSchema])).optional(),
  usCatalysts_th: z.array(z.string()).optional(),
  usCatalysts_en: z.array(z.string()).optional(),
  usCatalystsItems: z.array(CatalystItemSchema).optional(),
  topWatchlistTickers: z.array(z.string()),
  updatedAt: z.string(),
});
export type DigestSummary = z.infer<typeof DigestSummarySchema>;
