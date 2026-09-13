import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPrompt,
  detectCacheCategory,
  setSemanticCachedResponse,
  getSemanticCachedResponse,
  invalidateCacheForTicker,
} from './semanticCacheService';

describe('Semantic Cache & Vector RAG Service', () => {
  it('should generate consistent prompt hashes regardless of leading/trailing spaces', () => {
    const hash1 = hashPrompt('วิเคราะห์งบ PTT ไตรมาส 1', 'PTT');
    const hash2 = hashPrompt('  วิเคราะห์งบ PTT  ไตรมาส 1 ', 'ptt');
    expect(hash1).toBe(hash2);
  });

  it('should correctly detect financial cache categories', () => {
    expect(detectCacheCategory('ขอข้อมูลงบการเงิน P/E และปันผล หุ้น KBANK')).toBe('financial_report');
    expect(detectCacheCategory('ราคาหุ้น DELTA วันนี้ และแนวรับ')).toBe('realtime_price');
    expect(detectCacheCategory('ขอสรุปข่าวและแนวโน้มตลาดประจำวัน')).toBe('daily_analysis');
    expect(detectCacheCategory('สวัสดีครับ ขอคำแนะนำ')).toBe('general');
  });

  it('should store and retrieve cached response with 0 OpenRouter API calls', async () => {
    const prompt = 'ขอข้อมูลงบการเงินและปันผล PTT';
    const fakeResponse = 'หุ้น PTT มีอัตราเงินปันผลตอบแทนประมาณ 5.5% และ P/E อยู่ที่ 9.5 เท่า';

    await setSemanticCachedResponse(prompt, fakeResponse, 'google/gemini-3.8-flash', 'PTT');

    const result = await getSemanticCachedResponse(prompt, 'PTT');
    expect(result.hit).toBe(true);
    expect(result.entry?.responseText).toBe(fakeResponse);
    expect(result.source).toBe('exact');
  });

  it('should invalidate cache when stock data updates', async () => {
    const prompt = 'วิเคราะห์แนวโน้มราคา BDMS';
    await setSemanticCachedResponse(prompt, 'ราคา BDMS ปัจจุบัน 28 บาท', 'google/gemini-3.8-flash', 'BDMS');

    const clearedCount = await invalidateCacheForTicker('BDMS');
    expect(clearedCount).toBeGreaterThanOrEqual(1);

    const resultAfter = await getSemanticCachedResponse(prompt, 'BDMS');
    expect(resultAfter.hit).toBe(false);
  });
});
