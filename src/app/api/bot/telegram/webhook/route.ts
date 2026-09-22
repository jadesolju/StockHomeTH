import { NextRequest, NextResponse } from 'next/server';
import {
  sendTelegramMessage,
  editTelegramMessageText,
  answerCallbackQuery,
  TelegramInlineButton,
} from '@/lib/services/telegramBotService';
import {
  registerOrGetSubscriber,
  toggleSubscriberCategory,
  toggleSubscriberRound,
  togglePauseSubscriber,
  BotSubscriber,
  DigestCategory,
  DeliveryRound,
} from '@/lib/services/botSubscriptionService';
import { fetchStockMultiLayer } from '@/lib/services/stockDataService';
import { getLiveGoldContext } from '@/lib/services/liveIndicesService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Builds the interactive settings keyboard for Telegram
 */
function buildSettingsKeyboard(sub: BotSubscriber): TelegramInlineButton[][] {
  const hasStocks = sub.categories.includes('stocks');
  const hasGold = sub.categories.includes('gold');
  const hasBiz = sub.categories.includes('business');

  const hasMorning = sub.deliveryRounds.includes('morning');
  const hasEvening = sub.deliveryRounds.includes('evening');

  return [
    [
      {
        text: `${hasStocks ? '✅' : '⬜'} 📈 ข่าวหุ้น`,
        callback_data: 'toggle_cat:stocks',
      },
      {
        text: `${hasGold ? '✅' : '⬜'} 🥇 ราคาทอง`,
        callback_data: 'toggle_cat:gold',
      },
    ],
    [
      {
        text: `${hasBiz ? '✅' : '⬜'} 💼 ข่าวธุรกิจ & Macro`,
        callback_data: 'toggle_cat:business',
      },
    ],
    [
      {
        text: `${hasMorning ? '✅' : '⬜'} 🌅 เช้า 08:00`,
        callback_data: 'toggle_round:morning',
      },
      {
        text: `${hasEvening ? '✅' : '⬜'} 🌆 ค่ำ 18:00`,
        callback_data: 'toggle_round:evening',
      },
    ],
    [
      {
        text: sub.isPaused ? '▶️ เปิดรับข่าวต่อ' : '⏸ พักรับข่าวชั่วคราว',
        callback_data: 'toggle_pause',
      },
      {
        text: '📊 ดูกราฟสดบนเว็บ',
        url: 'https://stockhometh.com',
      },
    ],
  ];
}

/**
 * Generates the settings / welcome message text
 */
function buildSettingsMessageText(sub: BotSubscriber): string {
  const catsTh = sub.categories
    .map((c) => (c === 'stocks' ? 'หุ้น' : c === 'gold' ? 'ทองคำ' : 'ธุรกิจ & Macro'))
    .join(', ');
  const roundsTh = sub.deliveryRounds
    .map((r) => (r === 'morning' ? 'รอบเช้า (08:00 น.)' : 'รอบค่ำ (18:00 น.)'))
    .join(', ');

  return (
    `🏛 <b>StockHomeTH Market Digest Bot</b>\n` +
    `ยินดีต้อนรับคุณ <b>${sub.displayName || 'สมาชิก'}</b> 👋\n\n` +
    `📌 <b>สถานะการรับข่าวสาร:</b> ${sub.isPaused ? '🔴 <i>พักการรับข่าวชั่วคราว</i>' : '🟢 <i>เปิดรับอัตโนมัติ</i>'}\n` +
    `🏷 <b>แพ็กเกจสมาชิก:</b> <code>${sub.tier.toUpperCase()} TIER (ฟรีตลอดชีพ 100%)</code>\n` +
    `📂 <b>หมวดข่าวที่เลือก:</b> ${catsTh || 'ยังไม่ได้เลือก'}\n` +
    `⏰ <b>รอบเวลาที่ส่ง:</b> ${roundsTh || 'ยังไม่ได้เลือก'}\n\n` +
    `👇 <i>แตะปุ่มด้านล่างเพื่อเปิด/ปิดหมวดข่าวและรอบเวลาที่คุณต้องการได้ทันที:</i>`
  );
}

/**
 * POST: Telegram Webhook Entry Point
 */
export async function POST(req: NextRequest) {
  try {
    const update = await req.json();

    // ==========================================
    // 1. Handle Interactive Callback Queries (Buttons)
    // ==========================================
    if (update.callback_query) {
      const cb = update.callback_query;
      const data = cb.data as string;
      const chatId = cb.message?.chat?.id;
      const messageId = cb.message?.message_id;

      if (!chatId || !messageId) {
        return NextResponse.json({ ok: true });
      }

      if (data.startsWith('toggle_cat:')) {
        const cat = data.replace('toggle_cat:', '') as DigestCategory;
        const sub = await toggleSubscriberCategory('telegram', chatId, cat);
        await answerCallbackQuery(cb.id, `อัปเดตหมวด "${cat}" เรียบร้อยแล้ว`);
        await editTelegramMessageText(chatId, messageId, buildSettingsMessageText(sub), {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buildSettingsKeyboard(sub) },
        });
      } else if (data.startsWith('toggle_round:')) {
        const round = data.replace('toggle_round:', '') as DeliveryRound;
        const sub = await toggleSubscriberRound('telegram', chatId, round);
        await answerCallbackQuery(cb.id, `อัปเดตรอบ "${round}" เรียบร้อยแล้ว`);
        await editTelegramMessageText(chatId, messageId, buildSettingsMessageText(sub), {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buildSettingsKeyboard(sub) },
        });
      } else if (data === 'toggle_pause') {
        const sub = await togglePauseSubscriber('telegram', chatId);
        await answerCallbackQuery(cb.id, sub.isPaused ? 'พักการรับข่าวชั่วคราวแล้ว' : 'เปิดรับข่าวเรียบร้อยแล้ว');
        await editTelegramMessageText(chatId, messageId, buildSettingsMessageText(sub), {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buildSettingsKeyboard(sub) },
        });
      } else if (data === 'cmd_settings') {
        const sub = await registerOrGetSubscriber('telegram', chatId);
        await answerCallbackQuery(cb.id);
        await sendTelegramMessage(chatId, buildSettingsMessageText(sub), {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buildSettingsKeyboard(sub) },
        });
      }

      return NextResponse.json({ ok: true });
    }

    // ==========================================
    // 2. Handle Text Messages & Commands
    // ==========================================
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text.trim();
      const userProfile = {
        displayName: `${msg.from?.first_name || ''} ${msg.from?.last_name || ''}`.trim() || msg.from?.username,
        username: msg.from?.username,
      };

      const sub = await registerOrGetSubscriber('telegram', chatId, userProfile);

      // --- Command: /start or /settings ---
      if (text.startsWith('/start') || text.startsWith('/settings')) {
        await sendTelegramMessage(chatId, buildSettingsMessageText(sub), {
          parse_mode: 'HTML',
          reply_markup: { inline_keyboard: buildSettingsKeyboard(sub) },
        });
        return NextResponse.json({ ok: true });
      }

      // --- Command: /gold (Real-Time Thai & Spot Gold Quote) ---
      if (text.startsWith('/gold')) {
        const goldInfo = await getLiveGoldContext();
        const responseText =
          `🥇 <b>รายงานราคาทองคำล่าสุด (Live Quote)</b>\n\n` +
          `${goldInfo}\n\n` +
          `<i>*ข้อมูลอ้างอิงจากสมาคมค้าทองคำแห่งประเทศไทย & Spot Gold (XAU/USD)</i>`;
        await sendTelegramMessage(chatId, responseText, { parse_mode: 'HTML' });
        return NextResponse.json({ ok: true });
      }

      // --- Command: /stock <TICKER> (Quick Stock Fundamental Lookup) ---
      if (text.startsWith('/stock') || text.startsWith('/quote')) {
        const parts = text.split(/\s+/);
        const ticker = parts[1]?.toUpperCase().replace(/\.BK$/, '');

        if (!ticker) {
          await sendTelegramMessage(chatId, '💡 <i>วิธีใช้: พิมพ์ <code>/stock &lt;ชื่อหุ้น&gt;</code> เช่น <code>/stock DELTA</code> หรือ <code>/stock NVDA</code></i>');
          return NextResponse.json({ ok: true });
        }

        const stock = await fetchStockMultiLayer(ticker);
        if (!stock) {
          await sendTelegramMessage(chatId, `❌ ไม่พบข้อมูลหุ้น <b>${ticker}</b> ในระบบ กรุณาตรวจสอบชื่อย่อหลักทรัพย์`);
          return NextResponse.json({ ok: true });
        }

        const changeStr = stock.change > 0 ? `+${stock.change.toFixed(2)}% 🟢` : stock.change < 0 ? `${stock.change.toFixed(2)}% 🔴` : `0.00% ⚪`;
        const stockText =
          `📊 <b>ข้อมูลหลักทรัพย์: ${stock.name} ($${stock.ticker})</b>\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          `• <b>ราคาปัจจุบัน:</b> <code>${stock.price.toFixed(2)} ${stock.currency}</code> (${changeStr})\n` +
          `• <b>ตลาด:</b> ${stock.market} | <b>หมวดธุรกิจ:</b> ${stock.sector}\n` +
          `• <b>P/E Ratio:</b> ${stock.peRatio ? stock.peRatio.toFixed(1) : '—'}x\n` +
          `• <b>เงินปันผล (Dividend Yield):</b> ${stock.dividendYield ? stock.dividendYield.toFixed(2) : '—'}%\n` +
          `• <b>High/Low 52 สัปดาห์:</b> ${stock.high52w} / ${stock.low52w} ${stock.currency}\n` +
          `━━━━━━━━━━━━━━━━━━━━━\n` +
          (stock.aiInsight ? `💡 <b>AI Insight:</b> <i>${stock.aiInsight}</i>\n` : '') +
          `🌐 <i>ดูกราฟและงบการเงินเต็ม: <a href="https://stockhometh.com/stock/${stock.ticker}">stockhometh.com/stock/${stock.ticker}</a></i>`;

        await sendTelegramMessage(chatId, stockText, { parse_mode: 'HTML' });
        return NextResponse.json({ ok: true });
      }

      // --- Command: /pause ---
      if (text.startsWith('/pause')) {
        await togglePauseSubscriber('telegram', chatId, true);
        await sendTelegramMessage(chatId, '⏸ <i>พักการรับข่าวสรุปอัตโนมัติเรียบร้อยแล้ว พิมพ์ <code>/resume</code> เพื่อเปิดรับต่อได้ทุกเมื่อ</i>');
        return NextResponse.json({ ok: true });
      }

      // --- Command: /resume ---
      if (text.startsWith('/resume')) {
        await togglePauseSubscriber('telegram', chatId, false);
        await sendTelegramMessage(chatId, '▶️ <i>เปิดรับข่าวสรุปอัตโนมัติรอบ 08:00 และ 18:00 น. เรียบร้อยแล้วครับ!</i>');
        return NextResponse.json({ ok: true });
      }

      // --- Command: /help ---
      if (text.startsWith('/help')) {
        const helpText =
          `🏛 <b>คำสั่งที่สามารถใช้งานได้ในบอท:</b>\n\n` +
          `• <code>/start</code> หรือ <code>/settings</code> - ตั้งค่าหมวดข่าวและรอบเวลา\n` +
          `• <code>/gold</code> - ดูราคาทองคำแท่งและ Spot Gold สด\n` +
          `• <code>/stock &lt;ชื่อหุ้น&gt;</code> - ดูราคาและปัจจัยพื้นฐานหุ้น (เช่น <code>/stock DELTA</code>)\n` +
          `• <code>/pause</code> - พักการรับข่าวชั่วคราว\n` +
          `• <code>/resume</code> - เปิดรับข่าวต่อ\n` +
          `• <code>/help</code> - ดูคู่มือการใช้งานคำสั่ง`;
        await sendTelegramMessage(chatId, helpText, { parse_mode: 'HTML' });
        return NextResponse.json({ ok: true });
      }

      // Default response for other messages
      await sendTelegramMessage(
        chatId,
        `💡 พิมพ์ <code>/settings</code> เพื่อปรับแต่งหมวดข่าว หรือ <code>/help</code> เพื่อดูคำสั่งทั้งหมด`,
        { parse_mode: 'HTML' }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook Error]:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
