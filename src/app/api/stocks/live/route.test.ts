import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { fetchLiveStockFundamentals, fetchStockByTicker } from '../../../../lib/services/stockDataService';

vi.mock('../../../../lib/services/stockDataService', () => ({
  fetchLiveStockFundamentals: vi.fn(),
  fetchStockByTicker: vi.fn(),
}));

describe('GET /api/stocks/live', () => {
  const mockStock = {
    ticker: 'PTT',
    name: 'PTT Public Company Limited',
    price: 34.5,
    change: 0.5,
    pChange: 1.47,
    market: 'SET',
    sector: 'Energy',
    volume: '15.2M',
    marketCap: '$30B',
    dividendYield: 4.5,
    peRatio: 10.2,
    sentimentScore: 80,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchLiveStockFundamentals).mockResolvedValue([mockStock]);
    vi.mocked(fetchStockByTicker).mockResolvedValue(mockStock);
  });

  it('should return Stale-While-Revalidate header for normal catalog query (forceLive=false)', async () => {
    const req = new NextRequest('http://localhost:3000/api/stocks/live?page=1&limit=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toContain('stale-while-revalidate=59');
    expect(cacheControl).toContain('s-maxage=10');

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('should return no-store header when forceLive=true', async () => {
    const req = new NextRequest('http://localhost:3000/api/stocks/live?ticker=PTT&forceLive=true');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const cacheControl = res.headers.get('Cache-Control');
    expect(cacheControl).toContain('no-store');

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.ticker).toBe('PTT');
  });
});
