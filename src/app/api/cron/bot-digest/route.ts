import { NextRequest, NextResponse } from 'next/server';
import {
  broadcastTelegramDigest,
  formatMarketDigestHTML,
  sendTelegramMessage,
  MarketDigestData,
} from '@/lib/services/telegramBotService';
import { getActiveSubscribersForRound, DeliveryRound } from '@/lib/services/botSubscriptionService';
import { fetchLiveIndices } from '@/lib/services/liveIndicesService';
import { fetchLiveWeeklyAggregatedNews } from '@/lib/services/weeklyNewsAggregatorService';
import { getLiveWeeklyDigestIntelligence } from '@/lib/services/weeklyDigestIntelligenceService';
import { syncWeeklyNewsToR2 } from '@/lib/services/r2DataSyncService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const maxDuration = 60; // 60s max for serverless

/**
 * Helper to determine current Thai round (Morning 08:00 vs Evening 18:00)
 */
function getThaiRoundType(): DeliveryRound {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const thaiHours = (utcHours + 7) % 24;
  return thaiHours < 13 ? 'morning' : 'evening';
}

/**
 * Builds the centralized market digest package
 */
async function buildDigestPackage(roundType: DeliveryRound): Promise<MarketDigestData> {
  const [indices, weeklyNews, overview] = await Promise.all([
    fetchLiveIndices().catch(() => []),
    fetchLiveWeeklyAggregatedNews().catch(() => []),
    getLiveWeeklyDigestIntelligence().catch(() => null),
  ]);

  // Extract Key Indices
  const setIndexItem = indices.find((i) => i.symbol === 'SET' || i.name.includes('SET'));
  const goldThaiItem = indices.find((i) => i.symbol === 'GOLD_TH' || i.name.includes('ทองคำแท่ง'));
  const spotGoldItem = indices.find((i) => i.symbol === 'GOLD' || i.symbol === 'XAU' || i.name.includes('Spot Gold'));
  const usdThbItem = indices.find((i) => i.symbol === 'USDTHB' || i.name.includes('USD/THB'));

  const now = new Date();
  const dateStr = now.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = `${roundType === 'morning' ? '08:00' : '18:00'} น.`;

  // Rule-based signals extraction
  const signals: { asset: string; type: string; description: string; status: 'ACTIVE' | 'RESOLVED' }[] = [];

  if (setIndexItem && Math.abs(setIndexItem.change) >= 0.8) {
    signals.push({
      asset: 'SET Index',
      type: setIndexItem.change > 0 ? 'Bullish Movement' : 'Bearish Consolidation',
      description: `ดัชนีแกว่งตัว ${setIndexItem.change > 0 ? '+' : ''}${setIndexItem.change.toFixed(2)}% ปริมาณซื้อขายหนาแน่น`,
      status: 'ACTIVE',
    });
  }

  if (spotGoldItem && Math.abs(spotGoldItem.change) >= 0.6) {
    signals.push({
      asset: 'Spot Gold',
      type: 'Gold Volatility Signal',
      description: `ราคาทองคำตลาดโลกผันผวน ${spotGoldItem.change > 0 ? '+' : ''}${spotGoldItem.change.toFixed(2)}% ทดสอบแนวสำคัญ`,
      status: 'ACTIVE',
    });
  }

  const digest: MarketDigestData = {
    roundType,
    dateStr,
    timeStr,
    marketSnapshot: {
      setIndex: setIndexItem ? { price: setIndexItem.price, change: setIndexItem.change } : { price: 1385.2, change: 0.45 },
      goldThai: goldThaiItem
        ? { sell: goldThaiItem.price.toLocaleString(), buy: (goldThaiItem.price - 100).toLocaleString(), change: goldThaiItem.change }
        : { sell: '43,500', buy: '43,400', change: 100 },
      spotGold: spotGoldItem ? { price: spotGoldItem.price, change: spotGoldItem.change } : { price: 2685.5, change: 0.35 },
      usdThb: usdThbItem ? { price: usdThbItem.price, change: usdThbItem.change } : { price: 33.25, change: -0.1 },
    },
    highlights: (weeklyNews || []).slice(0, 4),
    overviewSummary: overview?.overviewSummary || overview?.mainHeadline || 'ตลาดหุ้นและราคาทองคำเคลื่อนไหวในกรอบรอปัจจัยเศรษฐกิจและการแถลงตัวเลขเงินเฟ้อ',
    signals,
  };

  // Sync digest to R2 for persistent zero-egress archive
  syncWeeklyNewsToR2(weeklyNews, overview || undefined).catch(() => {});

  return digest;
}

/**
 * GET/POST: Trigger Telegram Market Digest Broadcast
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roundParam = searchParams.get('round') as DeliveryRound | null;
    const isPreview = searchParams.get('preview') === 'true';
    const testChatId = searchParams.get('testChatId');

    const roundType = roundParam || getThaiRoundType();
    const digestData = await buildDigestPackage(roundType);

    // 1. Preview Mode: Return formatted HTML text without sending
    if (isPreview) {
      const htmlText = formatMarketDigestHTML(digestData);
      return NextResponse.json({
        success: true,
        mode: 'preview',
        roundType,
        htmlText,
        digestData,
      });
    }

    // 2. Test Mode: Send only to test chatId
    if (testChatId) {
      const htmlText = formatMarketDigestHTML(digestData);
      const res = await sendTelegramMessage(testChatId, htmlText, { parse_mode: 'HTML' });
      return NextResponse.json({
        success: res.success,
        mode: 'test_send',
        testChatId,
        messageId: res.messageId,
      });
    }

    // 3. Full Scheduled Broadcast Mode
    const subscribers = await getActiveSubscribersForRound(roundType);
    const telegramSubscribers = subscribers.filter((s) => s.channel === 'telegram');
    const chatIds = telegramSubscribers.map((s) => s.channelUserId);

    if (chatIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: `No active Telegram subscribers registered for round "${roundType}"`,
        subscriberCount: 0,
      });
    }

    const broadcastResult = await broadcastTelegramDigest(chatIds, digestData);

    return NextResponse.json({
      success: true,
      roundType,
      subscriberCount: chatIds.length,
      broadcastResult,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Bot Digest Cron Error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
