/**
 * StockHomeTH Telegram Market Digest & Signal Bot Service
 *
 * Provides Telegram Bot API integration, rich HTML formatting for market digests,
 * interactive inline keyboard generation, and rate-limited broadcast dispatching.
 */

import type { StockNewsItem, DigestSummary } from '../schemas/newsSchema';

export interface TelegramInlineButton {
  text: string;
  callback_data?: string;
  url?: string;
}

export interface TelegramSendMessageOptions {
  parse_mode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  reply_markup?: {
    inline_keyboard?: TelegramInlineButton[][];
    keyboard?: { text: string }[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
  };
  disable_web_page_preview?: boolean;
}

export interface MarketDigestData {
  roundType: 'morning' | 'evening';
  dateStr: string;
  timeStr: string;
  marketSnapshot: {
    setIndex?: { price: number; change: number };
    goldThai?: { buy: string | number; sell: string | number; change?: string | number };
    spotGold?: { price: number; change: number };
    usdThb?: { price: number; change: number };
  };
  highlights: StockNewsItem[];
  overviewSummary?: string;
  signals?: {
    asset: string;
    type: string;
    description: string;
    status: 'ACTIVE' | 'RESOLVED';
  }[];
}

const TELEGRAM_API_BASE = 'https://api.telegram.org';

export function getTelegramBotToken(): string {
  return process.env.TELEGRAM_BOT_TOKEN || '';
}

/**
 * Send a message via Telegram Bot API
 */
export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<{ success: boolean; messageId?: number; error?: string }> {
  const token = getTelegramBotToken();
  if (!token) {
    console.warn('[TelegramBotService] TELEGRAM_BOT_TOKEN not configured. Simulated send to:', chatId);
    return { success: true, messageId: Math.floor(Math.random() * 100000) };
  }

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
      disable_web_page_preview: options?.disable_web_page_preview ?? true,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn(`[TelegramBotService] API Error (${data.error_code}): ${data.description}`);
      return { success: false, error: data.description };
    }

    return { success: true, messageId: data.result?.message_id };
  } catch (err: any) {
    console.error('[TelegramBotService] Exception sending message:', err);
    return { success: false, error: err.message || 'Network exception' };
  }
}

/**
 * Answer a callback query (for interactive inline button taps)
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<boolean> {
  const token = getTelegramBotToken();
  if (!token) return true;

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    return false;
  }
}

/**
 * Edit an existing message text & inline keyboard (for dynamic toggles)
 */
export async function editTelegramMessageText(
  chatId: string | number,
  messageId: number,
  text: string,
  options?: TelegramSendMessageOptions
): Promise<boolean> {
  const token = getTelegramBotToken();
  if (!token) return true;

  try {
    const payload: Record<string, any> = {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: options?.parse_mode || 'HTML',
      disable_web_page_preview: true,
    };

    if (options?.reply_markup) {
      payload.reply_markup = options.reply_markup;
    }

    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/editMessageText`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return data.ok === true;
  } catch (err) {
    return false;
  }
}

/**
 * Format market digest into a clean, modern Telegram HTML card
 */
export function formatMarketDigestHTML(data: MarketDigestData): string {
  const isMorning = data.roundType === 'morning';
  const roundTitle = isMorning ? '🌅 สรุปข่าวรอบเช้า & ภาพรวมตลาด' : '🌆 สรุปตลาด & ข่าวเด่นรอบค่ำ';

  const formatChange = (val: number) => {
    if (val > 0) return `+${val.toFixed(2)}% 🟢`;
    if (val < 0) return `${val.toFixed(2)}% 🔴`;
    return `0.00% ⚪`;
  };

  const lines: string[] = [];

  // 1. Header
  lines.push(`<b>🏛 StockHomeTH Market Intelligence</b>`);
  lines.push(`<b>${roundTitle}</b>`);
  lines.push(`📅 <i>ประจำวันที่ ${data.dateStr} (${data.timeStr})</i>`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // 2. Market Rates Snapshot
  lines.push(`📊 <b>ภาวะตลาดและราคาสินทรัพย์</b>`);

  if (data.marketSnapshot.setIndex) {
    const set = data.marketSnapshot.setIndex;
    lines.push(`• <b>SET Index:</b> <code>${set.price.toFixed(2)}</code> (${formatChange(set.change)})`);
  }

  if (data.marketSnapshot.goldThai) {
    const gold = data.marketSnapshot.goldThai;
    lines.push(`• <b>ทองคำแท่ง 96.5%:</b> ขายออก <code>${gold.sell}</code> บาท | รับซื้อ <code>${gold.buy}</code> บาท`);
  }

  if (data.marketSnapshot.spotGold) {
    const spot = data.marketSnapshot.spotGold;
    lines.push(`• <b>Spot Gold (XAU/USD):</b> <code>$${spot.price.toFixed(2)}</code> (${formatChange(spot.change)})`);
  }

  if (data.marketSnapshot.usdThb) {
    const fx = data.marketSnapshot.usdThb;
    lines.push(`• <b>USD/THB:</b> <code>${fx.price.toFixed(2)}</code> บาท/ดอลลาร์`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  // 3. Overview Summary
  if (data.overviewSummary) {
    lines.push(`💡 <b>ประเด็นสำคัญประจำรอบ</b>`);
    lines.push(data.overviewSummary);
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  // 4. Top News Highlights (3-5 articles)
  if (data.highlights && data.highlights.length > 0) {
    lines.push(`📰 <b>ข่าวเด่นที่ต้องติดตาม</b>`);
    data.highlights.slice(0, 4).forEach((item, idx) => {
      const tickerTag = item.tickers && item.tickers.length > 0 ? ` [<b>$${item.tickers.join(', ')}</b>]` : '';
      const title = item.title_th || item.title;
      const summary = item.summary_th || item.summary;
      lines.push(`${idx + 1}. <b>${escapeHtml(title)}</b>${tickerTag}`);
      if (summary) {
        lines.push(`   ↳ <i>${escapeHtml(summary.slice(0, 140))}${summary.length > 140 ? '...' : ''}</i>`);
      }
    });
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  // 5. Rule-Based Signals (if any)
  if (data.signals && data.signals.length > 0) {
    lines.push(`⚡ <b>สัญญาณเทคนิคตามเกณฑ์ (Rule-Based)</b>`);
    data.signals.forEach((sig) => {
      lines.push(`• [<b>${escapeHtml(sig.asset)}</b>] <i>${escapeHtml(sig.type)}:</i> ${escapeHtml(sig.description)}`);
    });
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  }

  // 6. Footer Disclaimer & Link
  lines.push(`<i>*สรุปและวิเคราะห์อัตโนมัติโดย StockHomeTH AI Engine</i>`);
  lines.push(`🌐 <i>ติดตามกราฟสดและงบการเงินเต็มได้ที่: stockhometh.com</i>`);

  return lines.join('\n');
}

/**
 * Escapes HTML characters for Telegram HTML parse mode
 */
export function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Broadcast digest message to subscribers with safe rate-limiting (max 30 msgs/second)
 */
export async function broadcastTelegramDigest(
  subscriberChatIds: (string | number)[],
  digestData: MarketDigestData
): Promise<{ total: number; sent: number; failed: number; durationMs: number }> {
  const tStart = Date.now();
  const text = formatMarketDigestHTML(digestData);
  let sent = 0;
  let failed = 0;

  const buttons = [
    [
      { text: '📊 ดูกราฟสดบนเว็บ', url: 'https://stockhometh.com' },
      { text: '⚙️ ตั้งค่าหมวดข่าว', callback_data: 'cmd_settings' },
    ],
  ];

  // Process in batches of 25 to respect Telegram rate limits
  const BATCH_SIZE = 25;
  for (let i = 0; i < subscriberChatIds.length; i += BATCH_SIZE) {
    const batch = subscriberChatIds.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async (chatId) => {
      const res = await sendTelegramMessage(chatId, text, {
        parse_mode: 'HTML',
        reply_markup: { inline_keyboard: buttons },
      });
      if (res.success) {
        sent++;
      } else {
        failed++;
      }
    });

    await Promise.all(promises);

    // If more batches remain, wait 1000ms to stay below 30 msgs/second limit
    if (i + BATCH_SIZE < subscriberChatIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return {
    total: subscriberChatIds.length,
    sent,
    failed,
    durationMs: Date.now() - tStart,
  };
}

/**
 * Configure Telegram Webhook URL
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<{ success: boolean; description?: string }> {
  const token = getTelegramBotToken();
  if (!token) return { success: false, description: 'Missing TELEGRAM_BOT_TOKEN' };

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        drop_pending_updates: false,
        allowed_updates: ['message', 'callback_query'],
      }),
    });
    const data = await res.json();
    return { success: data.ok === true, description: data.description };
  } catch (err: any) {
    return { success: false, description: err.message };
  }
}
