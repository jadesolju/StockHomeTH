import { z } from 'zod';

export const MarketRegionSchema = z.enum(['thai', 'global']);
export type MarketRegion = z.infer<typeof MarketRegionSchema>;

export const SentimentTypeSchema = z.enum(['bullish', 'bearish', 'neutral']);
export type SentimentType = z.infer<typeof SentimentTypeSchema>;

export const MarketIndexSchema = z.object({
  symbol: z.string().min(1),
  name: z.string().min(1),
  value: z.number(),
  change: z.number(),
  changePercent: z.number(),
  region: MarketRegionSchema,
  isPositive: z.boolean(),
  sparklineData: z.array(z.number()).min(2),
  lastUpdated: z.string(),
});
export type MarketIndex = z.infer<typeof MarketIndexSchema>;

export const StockFundamentalSchema = z.object({
  ticker: z.string().min(1),
  name: z.string().min(1),
  market: z.enum(['SET', 'US']),
  sector: z.string().min(1),
  price: z.number(),
  currency: z.enum(['THB', 'USD']),
  change: z.number(),
  marketCap: z.string(),
  peRatio: z.number(),
  dividendYield: z.number(),
  high52w: z.number(),
  low52w: z.number(),
  volume: z.string(),
  sparkline7d: z.array(z.number()).min(2),
  analystRating: z.enum(['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell']),
  targetPrice: z.number(),
  sentimentScore: z.number().min(0).max(100),
  aiInsight: z.string(),
  description: z.string(),
});
export type StockFundamental = z.infer<typeof StockFundamentalSchema>;

export const SectorPerformanceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  changePercent: z.number(),
  region: MarketRegionSchema,
  topGainer: z.string().min(1),
});
export type SectorPerformance = z.infer<typeof SectorPerformanceSchema>;
