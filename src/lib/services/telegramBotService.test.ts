import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatMarketDigestHTML,
  escapeHtml,
  broadcastTelegramDigest,
  MarketDigestData,
} from './telegramBotService';
import {
  registerOrGetSubscriber,
  toggleSubscriberCategory,
  toggleSubscriberRound,
  togglePauseSubscriber,
  getActiveSubscribersForRound,
} from './botSubscriptionService';

describe('Telegram Market Digest Bot & Subscription Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDigestData: MarketDigestData = {
    roundType: 'morning',
    dateStr: '22 ก.ย. 2569',
    timeStr: '08:00 น.',
    marketSnapshot: {
      setIndex: { price: 1388.5, change: 0.65 },
      goldThai: { sell: '43,600', buy: '43,500', change: 150 },
      spotGold: { price: 2690.2, change: 0.45 },
      usdThb: { price: 33.2, change: -0.05 },
    },
    highlights: [
      {
        id: '1',
        title: 'DELTA แจ้งงบไตรมาสเติบโตโดดเด่น',
        summary: 'ยอดขาย Data Center AI ดันกำไรทำสถิติสูงสุดใหม่',
        region: 'thai',
        timeframe: 'daily',
        marketName: 'SET',
        date: 'วันนี้',
        time: '07:30 น.',
        periodLabel: 'ข่าวเช้า',
        sentiment: 'positive',
        tickers: ['DELTA'],
        readTime: '2 นาที',
        source: 'SET IR',
        category: 'macro',
        impactAnalysis: {
          targetSector: 'Technology',
          priceTrendOutlook: 'Bullish',
        },
      },
    ],
    overviewSummary: 'ภาพรวมตลาดหุ้นเปิดบวกรับแรงซื้อหุ้นกลุ่มอิเล็กทรอนิกส์และธนาคาร',
    signals: [
      {
        asset: 'SET Index',
        type: 'Bullish Breakout',
        description: 'ดัชนีผ่านระดับ 1,385 จุดด้วยปริมาณซื้อขายหนาแน่น',
        status: 'ACTIVE',
      },
    ],
  };

  describe('HTML Digest Formatting', () => {
    it('should format market snapshot and news cleanly with HTML tags', () => {
      const html = formatMarketDigestHTML(mockDigestData);

      expect(html).toContain('<b>🏛 StockHomeTH Market Intelligence</b>');
      expect(html).toContain('🌅 สรุปข่าวรอบเช้า & ภาพรวมตลาด');
      expect(html).toContain('SET Index:</b> <code>1388.50</code> (+0.65% 🟢)');
      expect(html).toContain('ทองคำแท่ง 96.5%:</b> ขายออก <code>43,600</code> บาท');
      expect(html).toContain('DELTA แจ้งงบไตรมาสเติบโตโดดเด่น');
      expect(html).toContain('[<b>$DELTA</b>]');
      expect(html).toContain('Bullish Breakout');
      expect(html).toContain('stockhometh.com');
    });

    it('should correctly escape HTML sensitive characters', () => {
      expect(escapeHtml('PTT & CPALL <Update>')).toBe('PTT &amp; CPALL &lt;Update&gt;');
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('Subscriber Registration & Preference Management', () => {
    it('should register a new subscriber with default Free Tier and all categories', async () => {
      const sub = await registerOrGetSubscriber('telegram', 123456789, {
        displayName: 'Somchai Trader',
        username: 'somchai_t',
      });

      expect(sub.channel).toBe('telegram');
      expect(sub.channelUserId).toBe('123456789');
      expect(sub.tier).toBe('free');
      expect(sub.categories).toEqual(['stocks', 'gold', 'business']);
      expect(sub.deliveryRounds).toEqual(['morning', 'evening']);
      expect(sub.isActive).toBe(true);
      expect(sub.isPaused).toBe(false);
    });

    it('should toggle categories on and off without removing all categories', async () => {
      const chatId = 987654321;
      await registerOrGetSubscriber('telegram', chatId);

      // Remove stocks
      const sub1 = await toggleSubscriberCategory('telegram', chatId, 'stocks');
      expect(sub1.categories).not.toContain('stocks');
      expect(sub1.categories).toContain('gold');

      // Add stocks back
      const sub2 = await toggleSubscriberCategory('telegram', chatId, 'stocks');
      expect(sub2.categories).toContain('stocks');
    });

    it('should toggle delivery rounds (morning / evening)', async () => {
      const chatId = 555444333;
      await registerOrGetSubscriber('telegram', chatId);

      const sub1 = await toggleSubscriberRound('telegram', chatId, 'morning');
      expect(sub1.deliveryRounds).toEqual(['evening']);

      const sub2 = await toggleSubscriberRound('telegram', chatId, 'morning');
      expect(sub2.deliveryRounds).toContain('morning');
    });

    it('should pause and resume subscriber notifications', async () => {
      const chatId = 111222333;
      await registerOrGetSubscriber('telegram', chatId);

      const subPaused = await togglePauseSubscriber('telegram', chatId, true);
      expect(subPaused.isPaused).toBe(true);

      const subActive = await togglePauseSubscriber('telegram', chatId, false);
      expect(subActive.isPaused).toBe(false);
    });

    it('should query active subscribers for morning round', async () => {
      const chatId = 777888999;
      await registerOrGetSubscriber('telegram', chatId);

      const morningSubs = await getActiveSubscribersForRound('morning');
      expect(morningSubs.some((s) => s.channelUserId === '777888999')).toBe(true);
    });
  });

  describe('Broadcast Queue Dispatcher', () => {
    it('should dispatch messages in batches with rate-limiting support', async () => {
      const mockChatIds = [101, 102, 103];
      const result = await broadcastTelegramDigest(mockChatIds, mockDigestData);

      expect(result.total).toBe(3);
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });
  });
});
