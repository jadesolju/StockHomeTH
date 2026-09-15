import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from './route';

describe('Webull API Route Security & Validation Tests', () => {
  describe('GET Handler Validation', () => {
    it('should reject invalid action', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull?action=invalid_action');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid action parameter');
    });

    it('should reject command injection attempt in symbol parameter', async () => {
      const maliciousSymbols = [
        'AAPL; id',
        'AAPL|whoami',
        'AAPL & calc',
        'AAPL" && echo HACKED',
        '$(id)',
        '`id`',
      ];

      for (const symbol of maliciousSymbols) {
        const req = new NextRequest(`http://localhost/api/stocks/webull?action=quote&symbol=${encodeURIComponent(symbol)}`);
        const res = await GET(req);
        const json = await res.json();
        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Invalid symbol parameter');
      }
    });

    it('should reject command injection attempt in symbols parameter', async () => {
      const maliciousSymbols = [
        'AAPL,TSLA; rm -rf /',
        'AAPL,TSLA|cat /etc/passwd',
        'AAPL,TSLA" $(id)',
      ];

      for (const symbols of maliciousSymbols) {
        const req = new NextRequest(`http://localhost/api/stocks/webull?action=parallel&symbols=${encodeURIComponent(symbols)}`);
        const res = await GET(req);
        const json = await res.json();
        expect(res.status).toBe(400);
        expect(json.success).toBe(false);
        expect(json.error).toBe('Invalid symbols parameter');
      }
    });

    it('should reject invalid interval parameter', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull?action=quote&symbol=AAPL&interval=10d;id');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid interval parameter');
    });

    it('should accept valid status action', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull?action=status');
      const res = await GET(req);
      const json = await res.json();
      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json).toHaveProperty('has_webull_sdk');
    });
  });

  describe('POST Handler Validation', () => {
    it('should reject command injection attempt in POST body', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'batch_bars',
          symbols: 'AAPL; echo HACKED',
          interval: '1d',
        }),
      });

      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid symbols parameter');
    });

    it('should reject malicious appKey or appSecret', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          appKey: 'key" & whoami & "',
          appSecret: 'secret',
        }),
      });

      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(400);
      expect(json.success).toBe(false);
      expect(json.error).toBe('Invalid appKey or appSecret parameter');
    });

    it('should accept valid status POST request', async () => {
      const req = new NextRequest('http://localhost/api/stocks/webull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'status',
          symbols: ['AAPL', 'TSLA'],
          interval: '1d',
        }),
      });

      const res = await POST(req);
      const json = await res.json();
      expect(res.status).toBe(200);
    });
  });
});
