import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockUpsert, mockSelect, mockOrder, mockLimit, mockQuote } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockUpsert: vi.fn().mockResolvedValue({ error: null }),
    mockSelect: vi.fn(),
    mockOrder: vi.fn(),
    mockLimit: vi.fn(),
    mockQuote: vi.fn(),
  };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

vi.mock('yahoo-finance2', () => {
  return {
    default: class {
      quote = mockQuote;
    },
  };
});

import { GET } from './route';

describe('Cron Sync Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return unauthorized if CRON_SECRET is set and auth header is invalid', async () => {
    process.env.CRON_SECRET = 'test_secret';
    const req = new Request('http://localhost:3000/api/cron/sync', {
      headers: { authorization: 'Bearer wrong_secret' },
    });

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
    delete process.env.CRON_SECRET;
  });

  it('should sync stocks correctly with Map O(1) lookup logic', async () => {
    delete process.env.CRON_SECRET;

    const mockStocks = [
      { ticker: 'PTT', market: 'SET', name: 'PTT Public', price: 30, change: 0, pe_ratio: 10, dividend_yield: 4 },
      { ticker: 'AAPL', market: 'NASDAQ', name: 'Apple Inc.', price: 180, change: 1, pe_ratio: 28, dividend_yield: 0.5 },
    ];

    mockLimit.mockResolvedValue({ data: mockStocks, error: null });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
    });

    mockQuote.mockResolvedValue([
      { symbol: 'PTT.BK', regularMarketPrice: 32.5, regularMarketChangePercent: 2.1, trailingPE: 11.2, trailingAnnualDividendYield: 0.045 },
      { symbol: 'AAPL', regularMarketPrice: 185.0, regularMarketChangePercent: 2.7, trailingPE: 29.1, trailingAnnualDividendYield: 0.005 },
    ]);

    const req = new Request('http://localhost:3000/api/cron/sync?limit=10');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const upsertedData = mockUpsert.mock.calls[0][0];
    expect(upsertedData).toHaveLength(2);

    expect(upsertedData[0]).toMatchObject({
      ticker: 'PTT',
      market: 'SET',
      price: 32.5,
      change: 2.1,
      pe_ratio: 11.2,
      dividend_yield: 0.045,
    });

    expect(upsertedData[1]).toMatchObject({
      ticker: 'AAPL',
      market: 'NASDAQ',
      price: 185.0,
      change: 2.7,
      pe_ratio: 29.1,
      dividend_yield: 0.005,
    });
  });

  it('should handle single object results from Yahoo Finance', async () => {
    delete process.env.CRON_SECRET;

    const mockStocks = [
      { ticker: 'TSLA', market: 'NASDAQ', name: 'Tesla Inc.', price: 200, change: -1, pe_ratio: 50, dividend_yield: 0 },
    ];

    mockLimit.mockResolvedValue({ data: mockStocks, error: null });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockSelect.mockReturnValue({ order: mockOrder });
    mockFrom.mockReturnValue({
      select: mockSelect,
      upsert: mockUpsert,
    });

    mockQuote.mockResolvedValue({
      symbol: 'TSLA',
      regularMarketPrice: 210.5,
      regularMarketChangePercent: 5.25,
      trailingPE: 52.0,
      trailingAnnualDividendYield: null,
    });

    const req = new Request('http://localhost:3000/api/cron/sync');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(1);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const upsertedData = mockUpsert.mock.calls[0][0];
    expect(upsertedData[0]).toMatchObject({
      ticker: 'TSLA',
      price: 210.5,
      change: 5.25,
      pe_ratio: 52.0,
      dividend_yield: null,
    });
  });
});
