import { NextRequest, NextResponse } from 'next/server';
import {
  canExecuteOpenRouterRequest,
  recordOpenRouterRequest,
  getChatCacheKey,
  getCachedChatResponse,
  setCachedChatResponse,
} from '@/lib/services/openRouterGuardService';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  userTier?: 'free' | 'lite' | 'pro' | 'vip' | 'whale';
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

// Concise, high-value Financial System Prompt (optimized to save input tokens)
const COMPACT_SYSTEM_PROMPT = `คุณคือ "StockHome Financial" AI ผู้ช่วยวิเคราะห์หุ้นและการเงินไทย (SET/mai) และสหรัฐฯ
หลักการตอบ:
1. ตอบกระชับ ตรงประเด็น เชิงวิเคราะห์งบการเงินและอัตราส่วน (P/E, P/BV, ROE, ปันผล) ชัดเจน
2. หลีกเลี่ยงคำเกริ่นยืดยาว ให้คำตอบเป็นข้อๆ หรือย่อหน้าสั้น อ่านเข้าใจง่าย
3. ปฏิบัติตามหลัก Do Your Own Research (DYOR): เตือนสติสั้นๆ 1 บรรทัดว่าเป็นการวิเคราะห์เพื่อการศึกษา ไม่ใช่คำแนะนำชวนซื้อขาย`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const {
      messages,
      model = 'google/gemini-3.8-flash',
      userTier = 'free',
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
    const isBackgroundHeader = Boolean(req.headers.get('x-background-job') || req.headers.get('x-cron'));
    const isRealUser = !isBackgroundHeader && lastUserMsg.length > 0;
    const guard = canExecuteOpenRouterRequest(isRealUser);
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

    // 3. Sliding Window: Keep only the last 4-6 messages (last 2-3 turns) to cut input token accumulation by up to 70%
    const recentMessages = messages.slice(-5);

    // 4. Micro Context for Stock / Market (compact payload)
    let systemPromptWithContext = COMPACT_SYSTEM_PROMPT;
    if (stockContext && stockContext.ticker) {
      systemPromptWithContext += `\n[บริบทหุ้น]: ${stockContext.ticker} (${stockContext.market || 'SET'}) ราคา: ${stockContext.price ?? '—'} (${stockContext.change != null ? (stockContext.change >= 0 ? '+' : '') + stockContext.change + '%' : '—'}) PE: ${stockContext.peRatio ?? '—'}x มาร์เก็ตแคป: ${stockContext.marketCap ?? '—'}`;
    }

    const fullMessages = [
      { role: 'system', content: systemPromptWithContext },
      ...recentMessages,
    ];

    // 5. Smart max_tokens limit based on tier
    const isProOrAbove = userTier === 'pro' || userTier === 'vip' || userTier === 'whale';
    const maxTokensLimit = isProOrAbove ? 800 : 450;

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

    // 5. Calculate GemCoins consumed with dynamic weighting (keeps 80-90% gross margin)
    // Free daily unit = 500 GemCoins.
    // Efficient models (Gemini 3.8 Flash, DeepSeek): ~6 to 14 GemCoins / answer (allowing 35-50 queries/day)
    // Pro/Whale models (GPT-5, Claude Sonnet 5): ~25 to 55 GemCoins / answer
    let gemCoinsUsed: number;
    if (model.includes('claude') || model.includes('gpt-5')) {
      gemCoinsUsed = Math.max(25, Math.round(totalTokens / 8));
    } else if (model.includes('gemini-3.1-pro') || model.includes('pro')) {
      gemCoinsUsed = Math.max(15, Math.round(totalTokens / 12));
    } else {
      // Gemini 3.8 Flash & DeepSeek
      gemCoinsUsed = Math.max(6, Math.round(totalTokens / 20));
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
