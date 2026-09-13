import { describe, it, expect } from 'vitest';
import { batchAnalyzeStockCandidates, CandidateStockData } from './batchStockScreenerService';

describe('Batch Processing Service', () => {
  it('should process multiple stock candidates in a single batch request', async () => {
    const mockCandidates: CandidateStockData[] = [
      {
        ticker: 'PTT',
        name: 'ปตท.',
        market: 'SET',
        price: 34.5,
        changePercent: 1.5,
        peRatio: 9.8,
        dividendYield: 5.2,
        signals: ['Golden Cross 50/200', 'Dividend Yield > 5%'],
      },
      {
        ticker: 'DELTA',
        name: 'เดลต้า อีเลคโทรนิคส์',
        market: 'SET',
        price: 142.0,
        changePercent: 3.2,
        peRatio: 65.0,
        dividendYield: 0.8,
        signals: ['RSI Bullish Momentum', 'High Volume Breakout'],
      },
    ];

    const result = await batchAnalyzeStockCandidates(mockCandidates);
    expect(result.processedCount).toBe(2);
    expect(result.evaluations['PTT']).toBeDefined();
    expect(result.evaluations['DELTA']).toBeDefined();
    expect(result.evaluations['PTT'].recommendation).toBeTruthy();
  });
});
