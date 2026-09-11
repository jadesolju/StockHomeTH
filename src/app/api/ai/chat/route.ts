import { NextRequest, NextResponse } from 'next/server';
import {
  canExecuteOpenRouterRequest,
  recordOpenRouterRequest,
  getChatCacheKey,
  getCachedChatResponse,
  setCachedChatResponse,
} from '@/lib/services/openRouterGuardService';
import { getModelGemCoinsEst } from '@/config/curated-models';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  userTier?: 'free' | 'lite' | 'pro' | 'vip' | 'whale' | 'dev';
  enableMemory?: boolean;
  stockContext?: {
    ticker: string;
    name?: string;
    price?: number;
    change?: number;
    market?: string;
    peRatio?: number;
    marketCap?: string;
  };
}

// High-value Financial System Prompt with smart topic pivoting & tier-differentiated reasoning
const COMPACT_SYSTEM_PROMPT = `คุณคือ "StockHome Financial" AI ผู้ช่วยวิเคราะห์หุ้นและการเงินไทย (SET/mai) และตลาดสหรัฐฯ
หลักการตอบ:
1. การเชื่อมโยงหัวข้อ (Smart Financial Pivot): หากผู้ใช้ถามเรื่องทั่วไป เช่น บันเทิง ภาพยนตร์ ดนตรี ท่องเที่ยว สถานที่ อาหาร รถยนต์ หรือไลฟ์สไตล์ **ห้ามปฏิเสธทื่อๆ หรือไล่ผู้ใช้ไปที่อื่น** ให้ตอบคลายข้อสงสัยสั้นๆ 1 ประโยค แล้ว**เชื่อมโยงเข้าสู่มุมมองหุ้น ธุรกิจ หรือการลงทุนที่เกี่ยวข้องทันที**
   - ตัวอย่าง: ถามเรื่องภาพยนตร์/ซีรีส์/ดนตรี -> โยงไปหุ้นกลุ่มโรงหนัง คอนเทนต์ มีเดีย (เช่น MAJOR, ONEE, WORK, BEC หรือ Netflix, Disney)
   - ตัวอย่าง: ถามเรื่องสถานที่เที่ยว/โรงแรม/ร้านอาหาร -> โยงไป AOT, CENTEL, MINT, ERW, CPALL, CPN
   - ตัวอย่าง: ถามเรื่องรถยนต์ไฟฟ้า (EV) หรือแกดเจ็ต -> โยงไปหุ้นชิ้นส่วนอิเล็กทรอนิกส์ พลังงาน และนิคมฯ (เช่น DELTA, HANA, KCE, EA, WHA)
2. สไตล์การสื่อสาร: **ไม่พรรณนา ไม่เกริ่นนำเยิ่นเย้อ** กระชับ ตรงไปตรงมา ไม่มีคำทักทายซ้ำซาก ตอบประเด็นเนื้อๆ ทันที
3. ความสมบูรณ์ของคำตอบ: ห้ามตัดจบประโยคกลางคัน ให้ตอบประเด็นให้จบสมบูรณ์ทุกครั้ง
4. DYOR: เตือนสติสั้นๆ 1 บรรทัดตอนท้ายว่าเป็นการวิเคราะห์เพื่อการศึกษา ไม่ใช่คำชวนซื้อขาย`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const {
      messages,
      model = 'google/gemini-3.8-flash',
      userTier = 'free',
      enableMemory = false,
      stockContext,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.OPENROUTER_API_KEY ||
      process.env.OPENROUTER_MANAGEMENT_KEY ||
      process.env.OPENROUTER_ADMIN_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'OPENROUTER_API_KEY is not configured on this server. หากเพิ่งเพิ่มใน Vercel Environment Variables กรุณากดปุ่ม Redeploy 1 ครั้งเพื่อให้ค่ามีผล',
        },
        { status: 500 }
      );
    }

    // 1. Check identical response cache to save tokens
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const cacheKey = getChatCacheKey(model, lastUserMsg);
    const cachedResponse = getCachedChatResponse(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({
        success: true,
        message: cachedResponse,
        model,
        gemCoinsUsed: 1, // minimal fee for instant cache hit
        fromCache: true,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Idle Protection & 1-call-per-day enforcement
    // If no real user is chatting or it's an automated ping, cap at 1 request per day
    const isDev = userTier === 'dev';
    const isBackgroundHeader = Boolean(req.headers.get('x-background-job') || req.headers.get('x-cron'));
    const isRealUser = isDev || (!isBackgroundHeader && lastUserMsg.length > 0);
    const guard = isDev ? { allowed: true, reason: undefined } : canExecuteOpenRouterRequest(isRealUser);
    if (!guard.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: guard.reason || 'ไม่มีผู้ใช้งานในขณะนี้: ระบบจำกัดการเรียก OpenRouter API ไว้ที่ 1 ครั้งต่อวันเพื่อประหยัดโควตา',
          isIdleBlocked: true,
        },
        { status: 429 }
      );
    }

    // 3. Sliding Window / Memory Retention Control
    // When enableMemory is FALSE (Default / Budget Mode):
    // Only send the latest user message. Zero previous conversation context sent.
    // When enableMemory is TRUE:
    // Retain up to 20 recent messages (capped at ~100K token budget).
    let outboundMessages: ChatMessage[];
    if (!enableMemory) {
      // Single-shot budget mode: only the latest user message
      const lastMsg = messages[messages.length - 1];
      outboundMessages = lastMsg ? [lastMsg] : [];
    } else {
      // Memory enabled: include conversation history up to 20 messages (~10 turns)
      outboundMessages = messages.slice(-20);
    }

    // 4. Micro Context for Stock / Market (compact payload)
    let systemPromptWithContext = COMPACT_SYSTEM_PROMPT;
    if (stockContext && stockContext.ticker) {
      systemPromptWithContext += `\n[บริบทหุ้น]: ${stockContext.ticker} (${stockContext.market || 'SET'}) ราคา: ${stockContext.price ?? '—'} (${stockContext.change != null ? (stockContext.change >= 0 ? '+' : '') + stockContext.change + '%' : '—'}) PE: ${stockContext.peRatio ?? '—'}x มาร์เก็ตแคป: ${stockContext.marketCap ?? '—'}`;
    }

    // Differentiate reasoning depth based on model capability tier
    const baseCoins = getModelGemCoinsEst(model);
    const isHighTierModel = baseCoins >= 300 || /opus|sonnet|pro|gpt-4|gpt-5|gpt-6|r1|max/i.test(model);
    if (isHighTierModel) {
      systemPromptWithContext += `\n[ระดับการวิเคราะห์]: คุณกำลังทำงานในฐานะโมเดลวิเคราะห์ระดับสถาบัน (High-Tier Intelligence) จงวิเคราะห์เชิงลึก (Deep-Dive Analysis) อย่างแท้จริง: เจาะลึกโครงสร้างธุรกิจ, ตัวเลขงบการเงิน, Valuation (P/E, P/BV), Catalysts สำคัญ และประเมินความเสี่ยงรอบด้าน โดยยังคงความกระชับ ตรงไปตรงมา ไม่พรรณนา`;
    } else {
      systemPromptWithContext += `\n[ระดับการวิเคราะห์]: ตอบแบบกระชับ รวดเร็ว สรุป Bullet Points สาระสำคัญตรงประเด็น`;
    }

    const fullMessages = [
      { role: 'system', content: systemPromptWithContext },
      ...outboundMessages,
    ];

    // 5. Smart max_tokens limit based on tier (Thai language requires ~3-4x tokens per word)
    const isProOrAbove = userTier === 'pro' || userTier === 'vip' || userTier === 'whale';
    const maxTokensLimit = isProOrAbove ? 3000 : 1800;

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 6. Send with transforms compression and provider price sorting
    const response = await fetch(openRouterUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': siteUrl,
        'X-OpenRouter-Title': 'StockHomeTH AI Helper',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: maxTokensLimit,
        transforms: ['compression'], // OpenRouter native context compression
        provider: {
          sort: 'price', // Auto-route to the most cost-effective reliable provider
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[OpenRouter API Error]:', response.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          {
            success: false,
            error: errorJson.error?.message || `OpenRouter returned status ${response.status}`,
          },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { success: false, error: `OpenRouter error (${response.status})` },
          { status: response.status }
        );
      }
    }

    const data = await response.json();
    const replyContent =
      data.choices?.[0]?.message?.content?.trim() ||
      'ขออภัย ระบบไม่สามารถประมวลผลคำตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';

    const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
    const totalTokens = usage.total_tokens || 120;

    // 6. Calculate GemCoins consumed
    // Baseline model price (baseCoins is already computed above)
    let gemCoinsUsed = baseCoins;

    // If memory is enabled and messages exceed 8 messages (4 turns),
    // calculate a modest context retention fee proportional to the additional tokens/turns
    if (enableMemory && messages.length > 8) {
      const extraBlocks = Math.ceil((messages.length - 8) / 8);
      // Each block of 8 messages adds 20% of base model price (capped at 2x base price)
      const contextSurcharge = Math.min(Math.round(baseCoins * 0.2 * extraBlocks), baseCoins);
      gemCoinsUsed = baseCoins + contextSurcharge;
    }

    // Record request in usage tracker and cache response
    recordOpenRouterRequest(isRealUser);
    setCachedChatResponse(cacheKey, replyContent, data.model || model);

    return NextResponse.json({
      success: true,
      message: replyContent,
      model: data.model || model,
      gemCoinsUsed,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[AI Chat Route Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
