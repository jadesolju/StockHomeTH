import { describe, it, expect } from 'vitest';
import { sanitizeSymbol, sanitizeInterval, sanitizeWorkers } from './stockSanitizer';

describe('stockSanitizer Utility Suite', () => {
  describe('sanitizeSymbol', () => {
    it('should sanitize valid symbols, trimming whitespace and converting to uppercase', () => {
      expect(sanitizeSymbol(' aapl ')).toBe('AAPL');
      expect(sanitizeSymbol('pTT.bk')).toBe('PTT.BK');
      expect(sanitizeSymbol('^GSPC')).toBe('^GSPC');
      expect(sanitizeSymbol('BTC-USD')).toBe('BTC-USD');
      expect(sanitizeSymbol('USDTHB=X')).toBe('USDTHB=X');
    });

    it('should return null for non-string inputs', () => {
      expect(sanitizeSymbol(null)).toBeNull();
      expect(sanitizeSymbol(undefined)).toBeNull();
      expect(sanitizeSymbol(123)).toBeNull();
      expect(sanitizeSymbol({})).toBeNull();
      expect(sanitizeSymbol([])).toBeNull();
    });

    it('should return null for empty or whitespace-only strings', () => {
      expect(sanitizeSymbol('')).toBeNull();
      expect(sanitizeSymbol('   ')).toBeNull();
    });

    it('should return null for invalid symbols with special characters or SQL/Command injection attempts', () => {
      expect(sanitizeSymbol('AAPL; DROP TABLE users;')).toBeNull();
      expect(sanitizeSymbol('<script>alert(1)</script>')).toBeNull();
      expect(sanitizeSymbol('AAPL$')).toBeNull();
      expect(sanitizeSymbol('VERYLONGSYMBOLTHATEXCEEDS20CHARACTERS')).toBeNull();
    });
  });

  describe('sanitizeInterval', () => {
    it('should accept valid interval strings and convert them to lowercase', () => {
      expect(sanitizeInterval('1D')).toBe('1d');
      expect(sanitizeInterval(' 1m ')).toBe('1m');
      expect(sanitizeInterval('5d')).toBe('5d');
      expect(sanitizeInterval('1WK')).toBe('1wk');
      expect(sanitizeInterval('3MO')).toBe('3mo');
    });

    it('should fallback to default "1d" for invalid interval values', () => {
      expect(sanitizeInterval('2d')).toBe('1d');
      expect(sanitizeInterval('invalid')).toBe('1d');
      expect(sanitizeInterval('100y')).toBe('1d');
    });

    it('should fallback to default "1d" for non-string inputs', () => {
      expect(sanitizeInterval(null)).toBe('1d');
      expect(sanitizeInterval(undefined)).toBe('1d');
      expect(sanitizeInterval(123)).toBe('1d');
      expect(sanitizeInterval({})).toBe('1d');
    });
  });

  describe('sanitizeWorkers', () => {
    it('should return valid integer worker numbers within the range 1-32', () => {
      expect(sanitizeWorkers(4)).toBe(4);
      expect(sanitizeWorkers(16)).toBe(16);
      expect(sanitizeWorkers('12')).toBe(12);
    });

    it('should enforce maximum upper limit of 32 workers', () => {
      expect(sanitizeWorkers(50)).toBe(32);
      expect(sanitizeWorkers('100')).toBe(32);
    });

    it('should fallback to default 8 workers when input is negative, 0, NaN, or non-numeric', () => {
      expect(sanitizeWorkers(0)).toBe(8);
      expect(sanitizeWorkers(-5)).toBe(8);
      expect(sanitizeWorkers('abc')).toBe(8);
      expect(sanitizeWorkers(NaN)).toBe(8);
      expect(sanitizeWorkers(null)).toBe(8);
      expect(sanitizeWorkers(undefined)).toBe(8);
    });

    it('should handle float inputs by rounding down or truncating', () => {
      expect(sanitizeWorkers(10.8)).toBe(10);
      expect(sanitizeWorkers('15.5')).toBe(15);
    });
  });
});
