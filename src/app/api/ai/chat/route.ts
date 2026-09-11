import { NextRequest, NextResponse } from 'next/server';
import {
  canExecuteOpenRouterRequest,
  recordOpenRouterRequest,
  getChatCacheKey,
  getCachedChatResponse,
  setCachedChatResponse,
} from '@/lib/services/openRouterGuardService';
import { getModelGemCoinsEst } from '@/config/curated-models';
import {
  SubscriptionTier,
  getTierLimits,
  getModelFallbackArray,
} from '@/config/tierModelLimits';
import { executeWithPriorityQueue } from '@/lib/services/aiQueueService';
import {
  manageContextWindow,
  ChatMessageLike,
} from '@/lib/services/contextSummaryService';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  userTier?: SubscriptionTier;
  enableMemory?: boolean;
  contextSummary?: string;
  summarizedUpToIndex?: number;
  stream?: boolean;
  images?: string[];
  documentText?: string;
  documentName?: string;
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
      enableMemory = true,
      contextSummary,
      summarizedUpToIndex = 0,
      stream = false,
      images = [],
      documentText,
      documentName,
      stockContext,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const tierLimits = getTierLimits(userTier);

    // 0. Multimodal Document Security Check according to Tier limits
    if (documentText && tierLimits.maxDocTokens !== Infinity) {
      const estimatedDocTokens = Math.ceil(documentText.length / 3.5);
      if (estimatedDocTokens > tierLimits.maxDocTokens) {
        return NextResponse.json(
          {
            success: false,
            error: `[SYSTEM NOTICE] ไฟล์เอกสารของคุณ (${estimatedDocTokens.toLocaleString()} Tokens) เกินโควตาของแพลน ${tierLimits.label} (สูงสุด ${tierLimits.maxDocTokens.toLocaleString()} Tokens) โปรดเลือกเฉพาะหน้าสรุปงบการเงิน หรืออัปเกรดแพลนเพื่อวิเคราะห์ไฟล์ไม่จำกัดขนาด`,
            isOversizedDoc: true,
          },
          { status: 400 }
        );
      }
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

    // 1. Check identical response cache to save tokens (bypass if images, docs, or streaming requested)
    const hasAttachments = (images && images.length > 0) || Boolean(documentText);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
    const cacheKey = getChatCacheKey(model, lastUserMsg);

    if (!hasAttachments && !stream) {
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
    }

    // 2. Idle Protection & 1-call-per-day enforcement
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

    // 3. Rolling Summarization & Context Window Management
    const contextResult = await manageContextWindow({
      messages: messages as ChatMessageLike[],
      userTier,
      enableMemory,
      existingSummary: contextSummary,
      summarizedUpToIndex,
      apiKey,
    });

    const outboundMessages = contextResult.outboundMessages;

    // 4. Build System Prompt with Financial Context & Rolling Summary
    let systemPromptWithContext = COMPACT_SYSTEM_PROMPT;

    if (stockContext && stockContext.ticker) {
      systemPromptWithContext += `\n[บริบทหุ้น]: ${stockContext.ticker} (${stockContext.market || 'SET'}) ราคา: ${stockContext.price ?? '—'} (${stockContext.change != null ? (stockContext.change >= 0 ? '+' : '') + stockContext.change + '%' : '—'}) PE: ${stockContext.peRatio ?? '—'}x มาร์เก็ตแคป: ${stockContext.marketCap ?? '—'}`;
    }

    // Differentiate reasoning depth based on tier capabilities
    const baseCoins = getModelGemCoinsEst(model);
    const isHighTierModel = baseCoins >= 300 || /opus|sonnet|pro|gpt-4|gpt-5|gpt-6|r1|max/i.test(model);
    if (tierLimits.deepReasoningAllowed || isHighTierModel) {
      systemPromptWithContext += `\n[ระดับการวิเคราะห์]: คุณกำลังทำงานในฐานะโมเดลวิเคราะห์ระดับสถาบัน (High-Tier Intelligence) จงวิเคราะห์เชิงลึก (Deep-Dive Analysis) อย่างแท้จริง: เจาะลึกโครงสร้างธุรกิจ, ตัวเลขงบการเงิน, Valuation (P/E, P/BV), Catalysts สำคัญ และประเมินความเสี่ยงรอบด้าน โดยยังคงความกระชับ ตรงไปตรงมา ไม่พรรณนา และต้องตอบประเด็นให้จบสมบูรณ์ทุกข้อ ห้ามตัดจบกลางประโยค`;
    } else {
      systemPromptWithContext += `\n[ระดับการวิเคราะห์]: ตอบแบบกระชับ รวดเร็ว สรุป Bullet Points สาระสำคัญตรงประเด็น`;
    }

    // Inject rolling summary into system prompt if exists
    if (contextResult.contextSummary && contextResult.contextSummary.trim().length > 0) {
      systemPromptWithContext += `\n\n[สรุปบริบทบทสนทนาก่อนหน้า (Rolling Context Summary)]:\n${contextResult.contextSummary}\n(กรุณาใช้บริบทนี้ในการทำความเข้าใจคำถามต่อเนื่อง โดยอ้างอิงข้อมูลเดิมได้อย่างเป็นธรรมชาติ ไม่ลืมสิ่งที่คุยกันไว้)`;
    }

    // 5. Build full messages payload with Multimodal support
    const formattedMessages: any[] = [
      { role: 'system', content: systemPromptWithContext },
    ];

    for (let i = 0; i < outboundMessages.length; i++) {
      const msg = outboundMessages[i];
      const isLatestUser = i === outboundMessages.length - 1 && msg.role === 'user';

      if (isLatestUser && hasAttachments) {
        let textContent = msg.content;
        if (documentText) {
          textContent += `\n\n[ข้อมูลเอกสารแนบ${documentName ? ' ' + documentName : ''}]:\n${documentText}`;
        }

        if (images && images.length > 0) {
          const contentParts: any[] = [{ type: 'text', text: textContent }];
          for (const imgUrl of images) {
            contentParts.push({
              type: 'image_url',
              image_url: { url: imgUrl },
            });
          }
          formattedMessages.push({ role: 'user', content: contentParts });
        } else {
          formattedMessages.push({ role: 'user', content: textContent });
        }
      } else {
        formattedMessages.push({ role: msg.role, content: msg.content });
      }
    }

    // 6. Token limit & Fallback Array
    const maxTokensLimit = tierLimits.maxOutputTokens;
    const fallbackArray = getModelFallbackArray(model);

    const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
    const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const requestPayload = {
      model,
      models: fallbackArray,
      route: 'fallback',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: maxTokensLimit,
      stream: Boolean(stream),
      provider: {
        sort: 'price',
      },
    };

    // 7. Execute Request with Priority Queue (Whale/VIP/Dev bypass queue)
    const openRouterResponse = await executeWithPriorityQueue(userTier, async () => {
      return await fetch(openRouterUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': siteUrl,
          'X-OpenRouter-Title': 'StockHomeTH AI Helper',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      });
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      console.error('[OpenRouter API Error]:', openRouterResponse.status, errorText);

      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          {
            success: false,
            error: errorJson.error?.message || `OpenRouter returned status ${openRouterResponse.status}`,
          },
          { status: openRouterResponse.status }
        );
      } catch {
        return NextResponse.json(
          { success: false, error: `OpenRouter error (${openRouterResponse.status})` },
          { status: openRouterResponse.status }
        );
      }
    }

    // ── Handle SSE Streaming Response ──
    if (stream && openRouterResponse.body) {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let actualModelUsed = model;
      let accumulatedText = '';
      let isTruncated = false;
      let finishReason = 'stop';

      const streamTransform = new ReadableStream({
        async start(controller) {
          const reader = openRouterResponse.body!.getReader();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || !trimmed.startsWith('data:')) continue;
                const jsonStr = trimmed.slice(5).trim();

                if (jsonStr === '[DONE]') {
                  // Calculate final coins
                  let gemCoinsUsed = getModelGemCoinsEst(actualModelUsed);
                  if (images && images.length > 0) {
                    gemCoinsUsed += images.length * 25;
                  }
                  gemCoinsUsed += contextResult.memoryCost;

                  const metaPayload = {
                    type: 'meta',
                    model: actualModelUsed,
                    gemCoinsUsed,
                    finishReason,
                    isTruncated,
                    contextSummary: contextResult.contextSummary,
                    summarizedUpToIndex: contextResult.summarizedUpToIndex,
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(metaPayload)}\n\n`));
                  controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                  continue;
                }

                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.model) {
                    actualModelUsed = parsed.model;
                  }
                  const choice = parsed.choices?.[0];
                  const delta = choice?.delta?.content;
                  if (choice?.finish_reason) {
                    finishReason = choice.finish_reason;
                    isTruncated = finishReason === 'length';
                  }

                  if (delta) {
                    accumulatedText += delta;
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({ type: 'chunk', delta })}\n\n`
                      )
                    );
                  }
                } catch {
                  // ignore incomplete JSON chunks
                }
              }
            }

            // Cache response if eligible
            if (!hasAttachments && accumulatedText) {
              recordOpenRouterRequest(isRealUser);
              setCachedChatResponse(cacheKey, accumulatedText, actualModelUsed);
            }
          } catch (err) {
            controller.error(err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(streamTransform, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    // ── Handle Standard JSON Response ──
    const data = await openRouterResponse.json();
    const choice = data.choices?.[0];
    const replyContent =
      choice?.message?.content?.trim() ||
      'ขออภัย ระบบไม่สามารถประมวลผลคำตอบได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง';

    const finishReason = choice?.finish_reason || 'stop';
    const isTruncated = finishReason === 'length';
    const actualModel = data.model || model;

    // 8. Calculate GemCoins consumed
    let gemCoinsUsed = getModelGemCoinsEst(actualModel);

    // Multimodal Vision fee: +25 GemCoins per image
    if (images && images.length > 0) {
      gemCoinsUsed += images.length * 25;
    }

    // Rolling memory fee (0 for Pro/VIP/Whale/Dev, 2 for Lite, 5 for Free only when summary was updated)
    gemCoinsUsed += contextResult.memoryCost;

    // Cache response if no media attached
    if (!hasAttachments) {
      recordOpenRouterRequest(isRealUser);
      setCachedChatResponse(cacheKey, replyContent, actualModel);
    }

    return NextResponse.json({
      success: true,
      message: replyContent,
      model: actualModel,
      gemCoinsUsed,
      finishReason,
      isTruncated,
      contextSummary: contextResult.contextSummary,
      summarizedUpToIndex: contextResult.summarizedUpToIndex,
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
