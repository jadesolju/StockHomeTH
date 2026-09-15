import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockSelect, mockOrder, mockLimit, mockUpsert, mockQuote } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockOrder: vi.fn(),
    mockLimit: vi.fn(),
    mockUpsert: vi.fn().mockResolvedValue({ error: null }),
    mockQuote: vi.fn()
  };
});

vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: vi.fn(() => ({
      from: mockFrom
    }))
  };
});

vi.mock('yahoo-finance2', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      quote: mockQuote
    }))
  };
});

import { GET } from './route';

describe('Cron Sync Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'stocks') {
        return {
          select: mockSelect,
          upsert: mockUpsert
        };
      }
      return {};
    });
  });

  it('should return 401 if CRON_SECRET is set but authorization header is missing or invalid', async () => {
    process.env.CRON_SECRET = 'my_super_secret';

    const req = new Request('http://localhost:3000/api/cron/sync', {
      headers: {}
    });

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');

    delete process.env.CRON_SECRET;
  });

  it('should successfully sync stocks using Map lookup for quotes', async () => {
    const mockStocks = [
      { ticker: 'PTT', market: 'SET', name: 'PTT PCL', price: 30, change: 0, pe_ratio: 10, dividend_yield: 4 },
      { ticker: 'AAPL', market: 'NASDAQ', name: 'Apple Inc.', price: 150, change: 0, pe_ratio: 25, dividend_yield: 1 }
    ];

    mockLimit.mockResolvedValue({ data: mockStocks, error: null });

    mockQuote.mockResolvedValue([
      { symbol: 'PTT.BK', regularMarketPrice: 34.5, regularMarketChangePercent: 1.5, trailingPE: 9.8, trailingAnnualDividendYield: 0.05 },
      { symbol: 'AAPL', regularMarketPrice: 180.2, regularMarketChangePercent: 2.1, trailingPE: 28.5, trailingAnnualDividendYield: 0.008 }
    ]);

    const req = new Request('http://localhost:3000/api/cron/sync?limit=50');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);

    expect(mockQuote).toHaveBeenCalledWith(['PTT.BK', 'AAPL']);
    expect(mockUpsert).toHaveBeenCalledWith([
      {
        ticker: 'PTT',
        name: 'PTT PCL',
        market: 'SET',
        price: 34.5,
        change: 1.5,
        pe_ratio: 9.8,
        dividend_yield: 0.05,
        updated_at: expect.any(String)
      },
      {
        ticker: 'AAPL',
        name: 'Apple Inc.',
        market: 'NASDAQ',
        price: 180.2,
        change: 2.1,
        pe_ratio: 28.5,
        dividend_yield: 0.008,
        updated_at: expect.any(String)
      }
    ]);
  });

  it('should handle single quote object response from yahooFinance', async () => {
    const mockStocks = [
      { ticker: 'NVDA', market: 'NASDAQ', name: 'Nvidia Corp.', price: 100, change: 0, pe_ratio: 50, dividend_yield: 0.1 }
    ];

    mockLimit.mockResolvedValue({ data: mockStocks, error: null });

    mockQuote.mockResolvedValue({
      symbol: 'NVDA',
      regularMarketPrice: 130.0,
      regularMarketChangePercent: 5.0,
      trailingPE: 55.0,
      trailingAnnualDividendYield: 0.001
    });

    const req = new Request('http://localhost:3000/api/cron/sync?limit=1');
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(1);

    expect(mockUpsert).toHaveBeenCalledWith([
      {
        ticker: 'NVDA',
        name: 'Nvidia Corp.',
        market: 'NASDAQ',
        price: 130.0,
        change: 5.0,
        pe_ratio: 55.0,
        dividend_yield: 0.001,
        updated_at: expect.any(String)
      }
    ]);
  });
});
