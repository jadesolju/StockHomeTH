import { describe, it, expect } from 'vitest';
import { resolveAssetAmbiguity } from './assetAmbiguityEngine';

describe('resolveAssetAmbiguity', () => {
  describe('Happy Path & Clear Queries', () => {
    it('should return CLEAR_TO_PROCEED for empty, null, or non-string inputs', () => {
      // @ts-expect-error testing invalid input types
      expect(resolveAssetAmbiguity(null)).toEqual({ status: 'CLEAR_TO_PROCEED' });
      // @ts-expect-error testing invalid input types
      expect(resolveAssetAmbiguity(undefined)).toEqual({ status: 'CLEAR_TO_PROCEED' });
      expect(resolveAssetAmbiguity('')).toEqual({ status: 'CLEAR_TO_PROCEED' });
    });

    it('should return CLEAR_TO_PROCEED for unrelated queries', () => {
      const result = resolveAssetAmbiguity('ขอดูลมฟ้าอากาศวันนี้หน่อย');
      expect(result).toEqual({ status: 'CLEAR_TO_PROCEED' });
    });

    it('should return CLEAR_TO_PROCEED with identity when bypass keyword is present', () => {
      const result = resolveAssetAmbiguity('ขอดูราคาทองคำแท่ง สมาคม');
      expect(result).toEqual({
        status: 'CLEAR_TO_PROCEED',
        pillars: {
          identity: 'Gold (ทองคำ)',
        },
      });
    });

    it('should return CLEAR_TO_PROCEED with identity when option bypass keyword is matched in query', () => {
      const result = resolveAssetAmbiguity('วิเคราะห์ apple หุ้นแม่');
      expect(result).toEqual({
        status: 'CLEAR_TO_PROCEED',
        pillars: {
          identity: 'Apple (AAPL vs AAPL80X)',
        },
      });
    });
  });

  describe('Negative Path & Ambiguous Queries', () => {
    it('should return NEED_CLARIFICATION for ambiguous gold queries without bypass/option match', () => {
      const result = resolveAssetAmbiguity('ทองคำ');
      expect(result.status).toBe('NEED_CLARIFICATION');
      if (result.status === 'NEED_CLARIFICATION') {
        expect(result.reason).toContain('Gold (ทองคำ)');
        expect(result.payload.detected_identity).toBe('Gold (ทองคำ)');
        expect(result.payload.suggested_options.length).toBeGreaterThan(0);
      }
    });

    it('should return NEED_CLARIFICATION for generic stock recommendation queries', () => {
      const result = resolveAssetAmbiguity('ช่วงนี้ซื้อหุ้นอะไรดี');
      expect(result.status).toBe('NEED_CLARIFICATION');
      if (result.status === 'NEED_CLARIFICATION') {
        expect(result.payload.detected_identity).toBe('Investment Strategy & Horizon');
      }
    });
  });
});
