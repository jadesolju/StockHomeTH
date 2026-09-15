import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

describe('Dev yfinance API Route - Security & Parameter Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return 403 if not in development environment', async () => {
    (process.env as any).NODE_ENV = 'production';

    const req = new NextRequest('http://localhost:3000/api/dev/yfinance?symbol=AAPL');
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toContain('Forbidden');
  });

  it('should reject invalid symbols containing command injection payloads (GET)', async () => {
    (process.env as any).NODE_ENV = 'development';
    delete process.env.VERCEL;

    const maliciousSymbols = [
      'PTT"; calc.exe "',
      'AAPL & whoami',
      'TSLA | rm -rf /',
      'NVDA`id`',
      '$(whoami)',
      'MSFT; ls -la',
    ];

    for (const symbol of maliciousSymbols) {
      const req = new NextRequest(`http://localhost:3000/api/dev/yfinance?symbol=${encodeURIComponent(symbol)}`);
      const res = await GET(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid symbol parameter');
    }
  });

  it('should reject invalid action parameter containing command injection payloads (POST)', async () => {
    (process.env as any).NODE_ENV = 'development';
    delete process.env.VERCEL;

    const maliciousActions = [
      'stocks; whoami',
      'single && calc.exe',
      'test | id',
    ];

    for (const action of maliciousActions) {
      const req = new NextRequest('http://localhost:3000/api/dev/yfinance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const res = await POST(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid action parameter');
    }
  });
});
