import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeTicker,
  fetchStockFromPool,
  StockPoolItem,
} from './stockPoolService';
import { fetchStockMultiLayer } from './stockDataService';
import { getLiveMacroGroundingContext } from './liveIndicesService';

describe('StockPoolService & Multi-Layer Zero-Rejection Architecture', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Ticker Normalization', () => {
    it('should strip .BK suffix and uppercase ticker symbols', () => {
      expect(normalizeTicker('delta.bk')).toBe('DELTA');
      expect(normalizeTicker('DELTA.BK')).toBe('DELTA');
      expect(normalizeTicker('ptt')).toBe('PTT');
      expect(normalizeTicker('CPALL')).toBe('CPALL');
      expect(normalizeTicker(' nvda ')).toBe('NVDA');
    });

    it('should handle empty or invalid inputs gracefully', () => {
      expect(normalizeTicker('')).toBe('');
      expect(normalizeTicker(null as any)).toBe('');
    });
  });

  describe('Multi-Layer Stock Resolver', () => {
    it('should resolve a valid stock ticker from pool or in-memory universe without rejection', async () => {
      const result = await fetchStockMultiLayer('DELTA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.ticker).toBe('DELTA');
        expect(result.price).toBeGreaterThan(0);
        expect(result.market).toBe('SET');
        expect(result.currency).toBe('THB');
      }
    });

    it('should resolve US giant stocks seamlessly', async () => {
      const result = await fetchStockMultiLayer('NVDA');
      expect(result).not.toBeNull();
      if (result) {
        expect(result.ticker).toBe('NVDA');
        expect(result.price).toBeGreaterThan(0);
        expect(result.currency).toBe('USD');
      }
    });
  });

  describe('Real-Time Macro & Thai Gold Grounding Context', () => {
    it('should generate rich Thai Gold and Macro grounding block for gold queries', async () => {
      const context = await getLiveMacroGroundingContext('ราคาทองวันนี้เป็นอย่างไรบ้าง');
      expect(context).toContain('สมาคมค้าทองคำแห่งประเทศไทย');
      expect(context).toContain('ทองคำแท่ง 96.5%');
      expect(context).toContain('ราคารับซื้อ');
      expect(context).toContain('ราคาขายออก');
    });

    it('should include major indices for market queries', async () => {
      const context = await getLiveMacroGroundingContext('วิเคราะห์ภาพรวมตลาดหุ้นและดัชนีวันนี้');
      expect(context).toContain('SET Index');
      expect(context).toContain('USD / THB');
    });

    it('should return empty string for unrelated non-financial queries', async () => {
      const context = await getLiveMacroGroundingContext('สวัสดีครับวันนี้สบายดีไหม');
      expect(context).toBe('');
    });
  });
});
