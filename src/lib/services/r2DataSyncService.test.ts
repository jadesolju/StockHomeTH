import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  syncMarketUniverseToR2,
  fetchMarketUniverseFromR2,
  fetchMarketSummaryFromR2,
  syncWeeklyNewsToR2,
  fetchWeeklyNewsFromR2,
  syncStockAnalysisToR2,
  fetchStockAnalysisFromR2,
  runEgressAuditReport,
} from './r2DataSyncService';
import * as cloudflareR2Service from './cloudflareR2Service';
import type { StockFundamental } from '../schemas/marketSchema';
import type { StockNewsItem } from '../schemas/newsSchema';

describe('Cloudflare R2 Two-Way Sync & Egress Optimization Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockStocks: StockFundamental[] = [
    {
      ticker: 'DELTA',
      name: 'Delta Electronics (Thailand)',
      market: 'SET',
      sector: 'Technology',
      price: 155.0,
      currency: 'THB',
      change: 2.5,
      marketCap: '1.93T',
      peRatio: 65.4,
      dividendYield: 0.8,
      high52w: 165.0,
      low52w: 70.0,
      volume: '15.2M',
      sparkline7d: [150, 155],
      analystRating: 'Buy',
      targetPrice: 165,
      sentimentScore: 80,
      description: 'Electronics manufacturer',
      aiInsight: 'Strong AI and EV data center demand.',
    },
    {
      ticker: 'NVDA',
      name: 'NVIDIA Corporation',
      market: 'US',
      sector: 'Technology',
      price: 128.5,
      currency: 'USD',
      change: -1.2,
      marketCap: '3.15T',
      peRatio: 48.2,
      dividendYield: 0.05,
      high52w: 140.0,
      low52w: 45.0,
      volume: '42.1M',
      sparkline7d: [130, 128.5],
      analystRating: 'Buy',
      targetPrice: 145,
      sentimentScore: 75,
      description: 'GPU leader',
      aiInsight: 'Dominant market share in AI GPU accelerators.',
    },
  ];

  const mockNews: StockNewsItem[] = [
    {
      id: 'news-1',
      title: 'SET Index Rally Led by Technology and Banking',
      summary: 'Thai market gains on foreign inflows.',
      keyTakeaways: ['Foreign inflow increases', 'Tech rally'],
      fullContent: 'Thai market gains on foreign inflows across all sectors.',
      region: 'thai',
      timeframe: 'weekly',
      marketName: 'SET Index',
      date: 'This Week',
      time: '14:00 น.',
      periodLabel: 'Weekly Intelligence',
      sentiment: 'bullish',
      tickers: ['DELTA', 'KBANK'],
      readTime: '3 นาที',
      source: 'SET / StockHomeTH',
      category: 'macro',
      impactAnalysis: {
        targetSector: 'Technology',
        priceTrendOutlook: 'Bullish Continuation',
      },
    },
  ];

  describe('Market Universe Sync & Fetch', () => {
    it('should serialize and upload market universe to R2 JSON files', async () => {
      const putSpy = vi.spyOn(cloudflareR2Service, 'putJsonToR2').mockResolvedValue({
        success: true,
        key: 'market/universe.json',
        url: '/api/upload/r2?key=market%2Funiverse.json',
        sizeBytes: 1024,
      });

      const result = await syncMarketUniverseToR2(mockStocks);

      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(2);
      expect(putSpy).toHaveBeenCalledTimes(2); // universe.json and summary.json
    });

    it('should fetch market summary with correct projections from R2', async () => {
      vi.spyOn(cloudflareR2Service, 'getJsonFromR2').mockResolvedValueOnce({
        version: '1.0.0',
        stocks: [
          {
            ticker: 'DELTA',
            name: 'Delta Electronics',
            market: 'SET',
            sector: 'Technology',
            price: 155.0,
            currency: 'THB',
            change: 2.5,
            updatedAt: new Date().toISOString(),
          },
        ],
      });

      const summary = await fetchMarketSummaryFromR2(true);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary[0].ticker).toBe('DELTA');
      expect(summary[0].price).toBe(155.0);
    });
  });

  describe('Weekly News Sync & Fetch', () => {
    it('should store and retrieve weekly news from R2', async () => {
      const putSpy = vi.spyOn(cloudflareR2Service, 'putJsonToR2').mockResolvedValue({
        success: true,
        key: 'news/weekly_digest.json',
        url: '/api/upload/r2?key=news%2Fweekly_digest.json',
        sizeBytes: 2048,
      });

      const res = await syncWeeklyNewsToR2(mockNews);
      expect(res?.success).toBe(true);
      expect(putSpy).toHaveBeenCalledWith(
        'news/weekly_digest.json',
        expect.objectContaining({ count: 1 }),
        expect.any(Object)
      );
    });
  });

  describe('Stock AI Analysis Offloading', () => {
    it('should offload heavy stock analysis JSON to R2', async () => {
      const putSpy = vi.spyOn(cloudflareR2Service, 'putJsonToR2').mockResolvedValue({
        success: true,
        key: 'ai/analysis/DELTA.json',
        url: '/api/upload/r2?key=ai%2Fanalysis%2FDELTA.json',
        sizeBytes: 512,
      });

      const payload = {
        summary: 'Deep dive DCF valuation of DELTA indicates fair value around 160 THB',
        strengths: ['High gross margins', 'EV supply chain leadership'],
        risks: ['Valuation multiple premium'],
      };

      const res = await syncStockAnalysisToR2('DELTA.BK', payload);
      expect(res?.success).toBe(true);
      expect(putSpy).toHaveBeenCalledWith(
        'ai/analysis/DELTA.json',
        expect.objectContaining({ ticker: 'DELTA', payload }),
        expect.any(Object)
      );
    });
  });

  describe('Egress Diagnostic & Audit Telemetry', () => {
    it('should generate comprehensive egress audit report', async () => {
      vi.spyOn(cloudflareR2Service, 'checkR2Health').mockResolvedValue({
        connected: true,
        bucket: 'stockhometh',
        endpoint: 'https://r2.cloudflarestorage.com',
        latencyMs: 45,
      });

      vi.spyOn(cloudflareR2Service, 'listObjectsFromR2').mockResolvedValue([
        { key: 'market/universe.json', size: 150000, lastModified: new Date() },
        { key: 'news/weekly_digest.json', size: 85000, lastModified: new Date() },
      ]);

      const report = await runEgressAuditReport();

      expect(report.r2Status.connected).toBe(true);
      expect(report.r2StoredAssets.length).toBe(2);
      expect(report.egressMetrics.egressCostSavingPct).toBeGreaterThan(90);
      expect(report.egressMetrics.unprojectedQueryRisks.length).toBeGreaterThan(0);
    });
  });
});
