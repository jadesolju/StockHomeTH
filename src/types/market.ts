/**
 * Types definition for Market Indices, Quotes, and Sector Metrics
 */

import type { SentimentType } from './stockNews';

export interface MarketIndex {
  symbol: string;         // e.g. 'SET', 'SET50', 'GSPC', 'IXIC'
  name: string;           // e.g. 'SET Index', 'NASDAQ Composite'
  value: number;          // e.g. 1452.30
  change: number;         // e.g. +12.45
  changePercent: number;  // e.g. +0.86
  region: 'thai' | 'global';
  isPositive: boolean;
  sparklineData: number[];
  lastUpdated: string;
}

export interface StockQuote {
  symbol: string;         // e.g. 'PTT', 'NVDA'
  name: string;           // e.g. 'PTT Public Company Limited', 'NVIDIA Corporation'
  price: number;
  change: number;
  changePercent: number;
  market: string;         // e.g. 'SET', 'NASDAQ'
  region: 'thai' | 'global';
  sector: string;
  peRatio?: number;
  marketCap?: string;
  sentiment: SentimentType;
}

export interface SectorPerformance {
  id: string;
  name: string;           // e.g. 'ICT & Tech', 'Energy & Utilities', 'Banking'
  changePercent: number;
  region: 'thai' | 'global';
  topGainer: string;
}
