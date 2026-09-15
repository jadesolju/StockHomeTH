import { describe, it, expect } from 'vitest';
import { sanitizeSymbol, sanitizeInterval, sanitizeWorkers } from '../../../../lib/utils/stockSanitizer';

describe('Parallel Stock Route Security Sanitizer', () => {
  it('sanitizes valid stock symbols correctly', () => {
    expect(sanitizeSymbol('AAPL')).toBe('AAPL');
    expect(sanitizeSymbol('PTT.BK')).toBe('PTT.BK');
    expect(sanitizeSymbol('BRK.A')).toBe('BRK.A');
    expect(sanitizeSymbol('  tsla  ')).toBe('TSLA');
  });

  it('rejects malicious shell command injection payloads in symbol', () => {
    expect(sanitizeSymbol('AAPL; cat /etc/passwd')).toBeNull();
    expect(sanitizeSymbol('AAPL | whoami')).toBeNull();
    expect(sanitizeSymbol('`id`')).toBeNull();
    expect(sanitizeSymbol('$(calc)')).toBeNull();
    expect(sanitizeSymbol('AAPL & calc')).toBeNull();
    expect(sanitizeSymbol('AAPL" && dir')).toBeNull();
    expect(sanitizeSymbol("AAPL' OR '1'='1")).toBeNull();
    expect(sanitizeSymbol('')).toBeNull();
    expect(sanitizeSymbol(123 as any)).toBeNull();
  });

  it('sanitizes interval with fallbacks to 1d', () => {
    expect(sanitizeInterval('1d')).toBe('1d');
    expect(sanitizeInterval('1h')).toBe('1h');
    expect(sanitizeInterval('5m')).toBe('5m');
    expect(sanitizeInterval('1mo')).toBe('1mo');
    expect(sanitizeInterval('invalid_interval')).toBe('1d');
    expect(sanitizeInterval('1d; rm -rf /')).toBe('1d');
  });

  it('sanitizes workers and enforces bounds [1..32]', () => {
    expect(sanitizeWorkers(8)).toBe(8);
    expect(sanitizeWorkers('16')).toBe(16);
    expect(sanitizeWorkers(-5)).toBe(8);
    expect(sanitizeWorkers(0)).toBe(8);
    expect(sanitizeWorkers(100)).toBe(32);
    expect(sanitizeWorkers('invalid; echo 1')).toBe(8);
  });
});
