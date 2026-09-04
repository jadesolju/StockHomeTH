import { fullMarketStocks } from '../data/fullMarketStocks';
import { mockMarketIndices } from '../data/mockMarketData';
import { mockDailyDigestSummary } from '../data/mockNewsData';

export interface ApiKeyItem {
  id: string;
  key: string;
  name: string;
  createdAt: string;
  tier: 'Free Dev' | 'Pro Preview' | 'Enterprise';
  status: 'active' | 'revoked';
  usageCount: number;
}

export interface ApiResponse<T = any> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
  meta?: {
    total?: number;
    rateLimitRemaining?: number;
    quota?: string;
  };
}

const STORAGE_API_KEYS_KEY = 'stock_home_dev_api_keys';

export const developerApiService = {
  // Load developer API keys from storage
  getApiKeys(): ApiKeyItem[] {
    try {
      const stored = localStorage.getItem(STORAGE_API_KEYS_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Failed to load API keys', e);
    }
    // Default initial demo key
    const defaultKey: ApiKeyItem = {
      id: 'key_1',
      key: 'sk_live_sth_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 6),
      name: 'Default App Key',
      createdAt: new Date().toISOString().split('T')[0],
      tier: 'Pro Preview',
      status: 'active',
      usageCount: 42
    };
    localStorage.setItem(STORAGE_API_KEYS_KEY, JSON.stringify([defaultKey]));
    return [defaultKey];
  },

  // Create new API Key
  createApiKey(name: string, tier: 'Free Dev' | 'Pro Preview' = 'Pro Preview'): ApiKeyItem {
    const keys = this.getApiKeys();
    const newKey: ApiKeyItem = {
      id: 'key_' + Date.now(),
      key: `sk_live_sth_${Math.random().toString(36).substring(2, 12)}_${Math.random().toString(36).substring(2, 6)}`,
      name: name || 'Developer Key',
      createdAt: new Date().toISOString().split('T')[0],
      tier,
      status: 'active',
      usageCount: 0
    };
    const updated = [newKey, ...keys];
    localStorage.setItem(STORAGE_API_KEYS_KEY, JSON.stringify(updated));
    return newKey;
  },

  // Revoke API Key
  revokeApiKey(id: string): ApiKeyItem[] {
    const keys = this.getApiKeys().map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k));
    localStorage.setItem(STORAGE_API_KEYS_KEY, JSON.stringify(keys));
    return keys;
  },

  // Simulate Execution of API Request for Playground
  executeMockApiCall(endpoint: string, method: 'GET' | 'POST', apiKey: string, payload?: any): ApiResponse {
    const keys = this.getApiKeys();
    const validKey = keys.find((k) => k.key === apiKey && k.status === 'active');

    if (!apiKey) {
      return {
        status: 401,
        message: 'Unauthorized: API Key is missing. Please provide X-API-KEY header.',
        timestamp: new Date().toISOString(),
        data: null
      };
    }

    if (!validKey) {
      return {
        status: 403,
        message: 'Forbidden: Provided API Key is invalid or revoked.',
        timestamp: new Date().toISOString(),
        data: null
      };
    }

    // Increment usage
    validKey.usageCount += 1;
    localStorage.setItem(STORAGE_API_KEYS_KEY, JSON.stringify(keys));

    const timestamp = new Date().toISOString();

    if (endpoint.startsWith('/api/v1/chart/')) {
      const parts = endpoint.split('/api/v1/chart/')[1]?.split('?');
      const sym = (parts?.[0] || 'PTT.BK').toUpperCase();
      return {
        status: 200,
        message: `High-resolution OHLCV Candlestick Feed for ${sym}`,
        timestamp,
        meta: { rateLimitRemaining: 995, quota: 'Anti-Block Bulk Engine Active' },
        data: {
          symbol: sym,
          period: '1mo',
          interval: '1d',
          current_price: 34.50,
          previous_close: 33.75,
          change: 0.75,
          change_percent: 2.22,
          high52w: 39.50,
          low52w: 29.00,
          candles_count: 30,
          sample_candle: {
            date: '2026-09-04',
            open: 34.00,
            high: 34.75,
            low: 33.90,
            close: 34.50,
            volume: 18500000,
            ma20: 33.80,
            ma50: 33.20,
            isUp: true
          }
        }
      };
    }

    if (endpoint === '/api/v1/stocks' || endpoint.startsWith('/api/v1/stocks?')) {
      return {
        status: 200,
        message: 'Success (Anti-Block Chunking Active)',
        timestamp,
        meta: { total: fullMarketStocks.length, rateLimitRemaining: 998, quota: '1,000 req/min' },
        data: fullMarketStocks
      };
    }

    if (endpoint.startsWith('/api/v1/stocks/')) {
      const ticker = endpoint.split('/api/v1/stocks/')[1]?.toUpperCase();
      const stock = fullMarketStocks.find((s) => s.ticker === ticker);
      if (stock) {
        return {
          status: 200,
          message: `Stock data for ${ticker}`,
          timestamp,
          data: stock
        };
      }
      return {
        status: 404,
        message: `Stock ticker '${ticker}' not found in SET / US index.`,
        timestamp,
        data: null
      };
    }

    if (endpoint === '/api/v1/news') {
      return {
        status: 200,
        message: 'Latest AI News Digest',
        timestamp,
        meta: { total: mockDailyDigestSummary.keyCatalysts.length },
        data: mockDailyDigestSummary
      };
    }

    if (endpoint === '/api/v1/market/indices') {
      return {
        status: 200,
        message: 'Realtime Global Indices',
        timestamp,
        data: mockMarketIndices
      };
    }

    if (endpoint === '/api/v1/ai/summarize' && method === 'POST') {
      return {
        status: 200,
        message: 'Gemini 1.5 Flash Article Summarization Completed',
        timestamp,
        data: {
          headline: payload?.title || 'AI Generated Digest for Stock Analysis',
          sentiment: 'BULLISH',
          sentimentScore: 0.88,
          keyTakeaways: [
            'Market liquidity expanding with strong investor participation.',
            'Revenue forecast revised upwards by 15% YoY.',
            'AI technology adoption accelerating core operational efficiency.'
          ],
          affectedTickers: ['NVDA', 'PTT', 'ADVANC']
        }
      };
    }

    return {
      status: 404,
      message: `Endpoint ${endpoint} not found`,
      timestamp,
      data: null
    };
  }
};
