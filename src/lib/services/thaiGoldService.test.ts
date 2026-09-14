import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchOfficialThaiGold,
  calculateFallbackThaiGold,
  getLiveThaiGoldPrice,
} from './thaiGoldService';

describe('thaiGoldService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchOfficialThaiGold', () => {
    it('should successfully parse HTML from GoldTraders classic website with inner tags', async () => {
      const sampleHtml = `
        <td style="text-align:left;width:81%;">&nbspประจำวันที่ <span id="DetailPlace_uc_goldprices1_lblAsTime"><b><font size="3">14/09/2569 เวลา 10:45 น. (ครั้งที่ 5)</font></b></span></td>
        <span id="DetailPlace_uc_goldprices1_lblBLSell"><b><font color="Red">68,000.00</font></b></span>
        <span id="DetailPlace_uc_goldprices1_lblBLBuy"><b><font color="Red">67,800.00</font></b></span>
      `;

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => sampleHtml,
      } as any);

      const result = await fetchOfficialThaiGold();
      expect(result).not.toBeNull();
      expect(result?.sellPrice).toBe(68000);
      expect(result?.buyPrice).toBe(67800);
      expect(result?.updateRound).toBe('14/09/2569 เวลา 10:45 น. (ครั้งที่ 5)');
      expect(result?.source).toBe('official_goldtraders');
    });

    it('should fallback to chnwt_api if GoldTraders scrape fails', async () => {
      global.fetch = vi
        .fn()
        .mockRejectedValueOnce(new Error('GoldTraders timeout'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            status: 'success',
            response: {
              update_time: 'เวลา 10:45 น. (ครั้งที่ 5)',
              price: {
                gold_bar: { buy: '67,800.00', sell: '68,000.00' },
                gold: { buy: '66,446.28', sell: '68,800.00' },
              },
            },
          }),
        } as any);

      const result = await fetchOfficialThaiGold();
      expect(result).not.toBeNull();
      expect(result?.sellPrice).toBe(68000);
      expect(result?.buyPrice).toBe(67800);
      expect(result?.ornamentSellPrice).toBe(68800);
      expect(result?.source).toBe('chnwt_api');
    });

    it('should return null if both network requests fail', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const result = await fetchOfficialThaiGold();
      expect(result).toBeNull();
    });
  });

  describe('calculateFallbackThaiGold', () => {
    it('should compute valid Thai gold price based on spot USD and fx rate', () => {
      const result = calculateFallbackThaiGold(4476.6, 32.84);
      expect(result.symbol).toBe('GOLD_THAI');
      expect(result.sellPrice).toBeGreaterThan(0);
      expect(result.buyPrice).toBe(result.sellPrice - 100);
      expect(result.source).toBe('calculated_fallback');
    });
  });

  describe('getLiveThaiGoldPrice', () => {
    it('should return calculated fallback if live fetching returns null', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Offline'));
      const result = await getLiveThaiGoldPrice(4000, 33);
      expect(result).not.toBeNull();
      expect(result.source).toBe('calculated_fallback');
    });
  });
});
