import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/services/yfinanceBridge', () => ({
  fetchLiveStocksFromYFinance: vi.fn().mockResolvedValue([
    { ticker: 'PTT', name: 'PTT Public Company', price: 34.25, change: 0.5, currency: 'THB' },
  ]),
}));

vi.mock('@/lib/services/stockPoolService', () => ({
  upsertStocksToPool: vi.fn().mockResolvedValue(1),
}));

describe('Cron Trigger Security & Ingestion Suite', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', 'test_secret_key_999');
  });

  it('should return 401 Unauthorized if Bearer token is missing', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool');
    const res = await GET(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it('should return 401 Unauthorized if Bearer token is invalid', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool', {
      headers: { authorization: 'Bearer invalid_secret' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('should return 200 OK and trigger sync with valid Bearer token', async () => {
    const req = new Request('http://localhost/api/cron/sync-market-pool', {
      headers: { authorization: 'Bearer test_secret_key_999' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.syncedCount).toBe(1);
  });
});
