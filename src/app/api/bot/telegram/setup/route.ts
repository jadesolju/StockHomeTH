import { NextRequest, NextResponse } from 'next/server';
import { setTelegramWebhook, getTelegramBotToken } from '@/lib/services/telegramBotService';

export const dynamic = 'force-dynamic';

/**
 * Helper endpoint to set up or verify Telegram Bot Webhook
 * Usage:
 * - GET /api/bot/telegram/setup (Checks current webhook info)
 * - GET /api/bot/telegram/setup?url=https://stockhometh.online/api/bot/telegram/webhook (Sets webhook URL)
 */
export async function GET(req: NextRequest) {
  const token = getTelegramBotToken();
  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'TELEGRAM_BOT_TOKEN is not configured in .env.local',
    }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  try {
    // If a target URL is provided, set the webhook
    if (targetUrl) {
      const result = await setTelegramWebhook(targetUrl);
      return NextResponse.json({
        success: result.success,
        message: result.success ? `Webhook configured successfully to: ${targetUrl}` : 'Failed to set webhook',
        details: result,
      });
    }

    // Otherwise, fetch current webhook info from Telegram
    const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const data = await res.json();

    return NextResponse.json({
      success: true,
      botTokenConfigured: true,
      currentWebhookInfo: data.result || data,
      instructions: 'To set webhook, pass ?url=https://stockhometh.online/api/bot/telegram/webhook',
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message || 'Error communicating with Telegram API',
    }, { status: 500 });
  }
}
