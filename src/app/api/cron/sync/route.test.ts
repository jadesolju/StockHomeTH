import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFrom, mockSelect, mockIn, mockOrder, mockLimit, mockUpsert, mockQuote, mockMarketStatus } = vi.hoisted(() => {
  return {
    mockFrom: vi.fn(),
    mockSelect: vi.fn(),
    mockIn: vi.fn(),
    mockOrder: vi.fn(),
    mockLimit: vi.fn(),
    mockUpsert: vi.fn().mockResolvedValue({ error: null }),
    mockQuote: vi.fn(),
    mockMarketStatus: { setOpen: true, usOpen: true }
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

vi.mock('@/lib/utils/marketHours', () => ({
  getSetMarketStatus: () => ({ isOpen: mockMarketStatus.setOpen }),
  getUsMarketStatus: () => ({ isOpen: mockMarketStatus.usOpen })
}));

import { GET } from './route';

describe('Cron Sync Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'my_super_secret';
    process.env.SUPABASE_SECRET_KEY = 'sb_secret_test_key';
    mockMarketStatus.setOpen = true;
    mockMarketStatus.usOpen = true;

    mockSelect.mockReturnValue({ in: mockIn });
    mockIn.mockReturnValue({ order: mockOrder });
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
    const req = new Request('http://localhost:3000/api/cron/sync', {
      headers: {}
    });

    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Unauthorized');
  });

  it('should fail closed when CRON_SECRET is not configured', async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(new Request('http://localhost:3000/api/cron/sync'));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error).toContain('CRON_SECRET');
  });

  it('should fail closed when no server-only Supabase write key is configured', async () => {
    delete process.env.SUPABASE_SECRET_KEY;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const response = await GET(new Request('http://localhost:3000/api/cron/sync', {
      headers: { authorization: 'Bearer my_super_secret' }
    }));
    const json = await response.json();

    expect(response.status).toBe(503);
    expect(json.success).toBe(false);
    expect(json.error).toContain('Supabase server secret');
  });

  it('should reject batch sizes outside the supported range', async () => {
    const response = await GET(new Request('http://localhost:3000/api/cron/sync?limit=101', {
      headers: { authorization: 'Bearer my_super_secret' }
    }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.success).toBe(false);
    expect(json.error).toContain('limit');
  });

  it('should skip quote downloads when all supported markets are closed', async () => {
    mockMarketStatus.setOpen = false;
    mockMarketStatus.usOpen = false;

    const response = await GET(new Request('http://localhost:3000/api/cron/sync', {
      headers: { authorization: 'Bearer my_super_secret' }
    }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(0);
    expect(mockQuote).not.toHaveBeenCalled();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('should successfully sync stocks using Map lookup for quotes', async () => {
    const mockStocks = [
      { ticker: 'PTT', market: 'SET', name: 'PTT PCL', price: 30, change: 0, pe_ratio: 10, dividend_yield: 4 },
      { ticker: 'AAPL', market: 'US', name: 'Apple Inc.', price: 150, change: 0, pe_ratio: 25, dividend_yield: 1 }
    ];

    mockLimit.mockResolvedValue({ data: mockStocks, error: null });

    mockQuote.mockResolvedValue([
      { symbol: 'PTT.BK', regularMarketPrice: 34.5, regularMarketChangePercent: 1.5, trailingPE: 9.8, trailingAnnualDividendYield: 0.05 },
      { symbol: 'AAPL', regularMarketPrice: 180.2, regularMarketChangePercent: 2.1, trailingPE: 28.5, trailingAnnualDividendYield: 0.008 }
    ]);

    const req = new Request('http://localhost:3000/api/cron/sync?limit=50', {
      headers: { authorization: 'Bearer my_super_secret' }
    });
    const response = await GET(req);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.count).toBe(2);

    expect(mockIn).toHaveBeenCalledWith('market', ['SET', 'MAI', 'US']);
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
        market: 'US',
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

    const req = new Request('http://localhost:3000/api/cron/sync?limit=1', {
      headers: { authorization: 'Bearer my_super_secret' }
    });
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
