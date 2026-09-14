import { NextRequest, NextResponse } from 'next/server';
import {
  canExecuteOpenRouterRequest,
  recordOpenRouterRequest,
  getChatCacheKey,
  getCachedChatResponse,
  setCachedChatResponse,
} from '@/lib/services/openRouterGuardService';
import {
  getSemanticCachedResponse,
  setSemanticCachedResponse,
} from '@/lib/services/semanticCacheService';
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
import { fetchStockMultiLayer } from '@/lib/services/stockDataService';
import { resolveAssetAmbiguity } from '@/lib/services/assetAmbiguityEngine';
import { getLiveMacroGroundingContext } from '@/lib/services/liveIndicesService';
import { extractCandidateTickers } from '@/lib/utils/tickerExtractor';

export const dynamic = 'force-dynamic';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  model?: string;
  userTier?: SubscriptionTier;
  userId?: string;
  userEmail?: string;
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

// Core System Prompt for StockHome AI Agent based on accurate grounding & Universal Financial Asset Router v2.0
const COMPACT_SYSTEM_PROMPT = `คุณคือ "Core Gatekeeper & Analytical Engine" และ AI ผู้ช่วยอัจฉริยะประจำเว็บไซต์ StockHomeTH แพลตฟอร์มศูนย์รวมข้อมูลหุ้นไทยและตลาดสากล

[CRITICAL DIRECTIVE: ZERO-ASSUMPTION POLICY & REAL-TIME GROUNDING]
คุณต้องยึดมั่นในความถูกต้องแม่นยำของข้อมูลและอ้างอิงข้อมูลสดที่ระบบดึงมาให้เป็นหลัก
1. การตรวจสอบและตอบสนองทันที (Instant Multi-Asset Grounding):
   - หากผู้ใช้ถามถึง "ทองคำ" หรือ "ราคาทอง": จงนำข้อมูลราคาทองคำแท่งและทองรูปพรรณจากสมาคมค้าทองคำแห่งประเทศไทย (GTA) และ Spot Gold (USD/oz) ที่ระบบแนบมาให้ในบริบทมาตอบผู้ใช้ทันทีอย่างครบถ้วน ชัดเจน และวิเคราะห์ทิศทางร่วมกับค่าเงินบาท (USD/THB) ได้อย่างมั่นใจ
   - หากผู้ใช้ถามถึง "หุ้น", "ดัชนีตลาด", "น้ำมัน", "บิตคอยน์" หรือ "ค่าเงิน": ให้อ้างอิงตัวเลขราคาและการเปลี่ยนแปลงล่าสุดจากบล็อกข้อมูล Real-Time ที่ระบบดึงมาให้
   - หากชื่อสินทรัพย์มีความเฉพาะเจาะจง (เช่น หุ้นแม่บน NASDAQ vs DRx บน SET) ให้อธิบายความต่างให้เข้าใจง่าย
2. เมื่อมีข้อมูล Real-Time ในบริบท: ให้ตอบข้อมูลและตัวเลขเหล่านั้นทันที ห้ามปฏิเสธหรือบอกว่าระบบไม่มีข้อมูล

[CONTINUOUS CONVERSATION & CONTEXT RETENTION]
- ในการสนทนาแบบต่อเนื่องในห้องแชทเดิม (Multi-turn conversation): ให้รักษาบริบทเรื่องเดิมที่ผู้ใช้กำลังวิเคราะห์อยู่อย่างต่อเนื่องเสมอ เช่น หากเดิมคุยเรื่องพอร์ตการลงทุน สินทรัพย์ทางเลือก (Bitcoin, ทองคำ) แล้วถามต่อ ให้เชื่อมโยงและต่อยอดบริบทเดิมทันที ห้ามทึกทักว่าผู้ใช้เปลี่ยนเรื่องกะทันหัน หรือถามหาการยืนยันตัวเลือกซ้ำซ้อน เว้นแต่ผู้ใช้จะพิมพ์คำสั่งเริ่มต้นเรื่องใหม่ชัดเจน เช่น /new, /next, หรือ /clear

[กฎเกณฑ์การสื่อสารทางวิทยาศาสตร์และวิศวกรรมการเงิน (Sci-Com & Eng-Com Principles)]:
1. ความโปร่งใสของข้อมูล: ระบุแหล่งที่มา วันที่ และเวลาของข้อมูลอย่างชัดเจนเสมอ
2. การระบุหน่วยอย่างชัดแจ้ง (Explicit Denomination): ห้ามแสดงตัวเลขลอยๆ ให้กำกับหน่วยเสมอ เช่น บาทต่อบาททองคำ, ดอลลาร์สหรัฐ/ทรอยออนซ์, บาท, USD
3. ปราศจากการปรุงแต่ง (No Hallucination): ใช้ตัวเลขราคาล่าสุดจากระบบ ห้ามสุ่มเดาราคา
4. การคำนวณทางคณิตศาสตร์: อาศัยตัวเลขจริงจากการประมวลผล ห้ามประเมินตัวเลขทบต้นหรือตัวเลขงบการเงินคลาดเคลื่อน
5. สรุปกระชับ ตรงประเด็น ปิดท้ายด้วยเตือนความเสี่ยง DYOR สั้นๆ 1 บรรทัดเสมอ: "การลงทุนมีความเสี่ยง ข้อมูลนี้จัดทำขึ้นเพื่อการศึกษาและการวิเคราะห์ ไม่ใช่คำชี้ชวนในการซื้อขายหลักทรัพย์"`;

// Strict Anchoring System Lore for Real-Time Stock & Macro RAG
const STRICT_ANCHORING_LORE = `[โหมดวิเคราะห์ข้อมูลสินทรัพย์และตลาด Real-Time (Strict Grounding & Multi-Asset Anchoring)]
คุณคือ "ผู้เชี่ยวชาญด้านการเงินและการลงทุน" ประจำเว็บไซต์ StockHomeTH ที่ทำหน้าที่วิเคราะห์ข้อมูลตลาดจริงจากบล็อกข้อมูล Real-Time ที่แนบมาให้

[กฎเหล็ก]
1. สินทรัพย์และราคาสด: ให้ตอบตัวเลขราคา, สกุลเงิน, การเปลี่ยนแปลง (%) และรอบเวลาอัปเดตจากบล็อกข้อมูลดิบที่แนบมา (เช่น ราคาทองคำแท่งสมาคมฯ, ราคาน้ำมัน, ดัชนีตลาด หรือราคาหุ้น) โดยตรง
2. ห้ามใช้การสุ่มเดาตัวเลข: อ้างอิงตัวเลขล่าสุดจากข้อมูล Real-Time / StockHomeTH Pool ที่ดึงมาให้เสมอ
3. หากผู้ใช้ถามเรื่องหุ้นรายตัว: ให้อ้างอิงราคาและข้อมูลตัวชี้วัดจากบล็อก [ข้อมูลราคาและบทวิเคราะห์หุ้น Real-Time / StockHomeTH Pool] มานำเสนอเป็นอันดับแรกอย่างครบถ้วน (ราคาปัจจุบัน, ความเคลื่อนไหว, P/E, 52w Range, Valuation, แนวโน้มเทคนิค และจุดแข็ง/ความเสี่ยง)
4. หากผู้ใช้ถามเรื่องราคาทองคำ: สรุปราคารับซื้อ-ราคาขายออกของทองคำแท่ง 96.5% สมาคมค้าทองคำแห่งประเทศไทย, ราคา Gold Spot โลก (USD/oz) และค่าเงินบาท (USD/THB) ประกอบกันอย่างครบถ้วน
5. ระบุแหล่งที่มาและเวลาอัปเดตของข้อมูลอย่างชัดเจนเสมอ เพื่อความน่าเชื่อถือ`;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatRequestBody;
    const {
      messages,
      model = 'google/gemini-3.8-flash',
      userTier = 'free',
      userId,
      userEmail,
      enableMemory = true,
      contextSummary,
      summarizedUpToIndex = 0,
      stream = false,
      images = [],
      documentText,
      documentName,
      stockContext,
    } = body;

    // 0. Mandatory Authentication Guard: Block unauthenticated guest requests
    const isDev = userTier === 'dev';
    if (!userId && !isDev) {
      return NextResponse.json(
        {
          success: false,
          error: 'กรุณาเข้าสู่ระบบก่อนใช้งาน AI ผู้ช่วยอัจฉริยะ (สมาชิกทั่วไปรับฟรี 500 GemCoins ทุกวัน)',
          requiresLogin: true,
        },
        { status: 401 }
      );
    }

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

    // 1. Pre-extract tickers to determine if this is a live stock question
    const hasAttachments = (images && images.length > 0) || Boolean(documentText);
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content || '';

    // 1.1 Universal Asset Ambiguity Gatekeeper (Zero-Assumption Policy)
    // Enforces 3-Pillar Validation for initial standalone prompts.
    // Bypassed during multi-turn chat sessions (messages.length > 1) to maintain continuous context.
    if (messages.length <= 1) {
      const ambiguityResult = resolveAssetAmbiguity(lastUserMsg);
      if (ambiguityResult.status === 'NEED_CLARIFICATION') {
        return NextResponse.json({
          success: true,
          status: 'NEED_CLARIFICATION',
          needClarification: true,
          message: ambiguityResult.payload.prompt_text,
          payload: ambiguityResult.payload,
          gemCoinsUsed: 0,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const candidateTickers = extractCandidateTickers(lastUserMsg);
    const activeTicker = stockContext?.ticker || (candidateTickers.length > 0 ? candidateTickers[0] : null);

    const cacheKey = getChatCacheKey(model, lastUserMsg);

    // Code-First Semantic Cache Check (0 API calls to OpenRouter if hit)
    if (!hasAttachments && !stream) {
      const semanticResult = await getSemanticCachedResponse(lastUserMsg, activeTicker || undefined);
      if (semanticResult.hit && semanticResult.entry) {
        return NextResponse.json({
          success: true,
          message: semanticResult.entry.responseText,
          model: semanticResult.entry.model || model,
          gemCoinsUsed: 0, // 0 OpenRouter API calls
          fromCache: true,
          cacheType: semanticResult.source,
          timestamp: new Date().toISOString(),
        });
      }

      const cachedResponse = getCachedChatResponse(cacheKey);
      if (cachedResponse) {
        return NextResponse.json({
          success: true,
          message: cachedResponse,
          model,
          gemCoinsUsed: 0, // 0 OpenRouter API calls
          fromCache: true,
          cacheType: 'exact',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // 2. Idle Protection & 1-call-per-day enforcement
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

    // 3.5 Real-Time Stock RAG & Macro Grounding Data Retrieval (Thai Gold, Oil, SET, BTC, Forex)
    let isLiveStockRAG = false;
    let liveMarketDataBlock = '';

    const now = new Date();
    const formattedNowDate = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedNowTime = now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) + ' น.';

    try {
      // 1. Concurrent fetch: Macro Grounding & Multi-Layer Stock Resolver
      const macroPromise = getLiveMacroGroundingContext(lastUserMsg);

      let liveStockPromise: Promise<any> = Promise.resolve(null);
      const targetTickers = activeTicker ? [activeTicker] : candidateTickers;
      if (targetTickers.length > 0) {
        liveStockPromise = (async () => {
          for (const cand of targetTickers) {
            const res = await fetchStockMultiLayer(cand, stockContext?.market, false);
            if (res && res.price > 0) return res;
          }
          return null;
        })();
      }

      const [macroContext, liveStock] = await Promise.all([macroPromise, liveStockPromise]);

      if (macroContext) {
        isLiveStockRAG = true;
        liveMarketDataBlock += `\n${macroContext}\n`;
      }

      if (liveStock) {
        isLiveStockRAG = true;
        const currencySymbol = liveStock.currency === 'THB' ? '฿' : '$';
        const rating = liveStock.analystRating || 'Hold';
        const target = liveStock.targetPrice ? ` (ราคาเป้าหมายประเมิน: ${currencySymbol}${liveStock.targetPrice})` : '';
        const valuationVerdict = liveStock.analysisPayload?.valuationVerdict || (liveStock.peRatio && liveStock.peRatio > 40 ? 'Growth Premium' : 'Fairly Valued');
        const technicalTrend = liveStock.technicalIndicators?.trend || (liveStock.change >= 0 ? 'BULLISH' : 'CONSOLIDATION');
        const strengthsList = Array.isArray(liveStock.analysisPayload?.strengths) && liveStock.analysisPayload.strengths.length > 0
          ? liveStock.analysisPayload.strengths.join('; ')
          : `ผู้นำกลุ่มอุตสาหกรรม ${liveStock.sector || 'SET'} และมีสภาพคล่องสูง`;
        const risksList = Array.isArray(liveStock.analysisPayload?.risks) && liveStock.analysisPayload.risks.length > 0
          ? liveStock.analysisPayload.risks.join('; ')
          : 'ความผันผวนของตลาดสากล ปัจจัยมหภาค และอัตราแลกเปลี่ยน';

        liveMarketDataBlock += `\n[ข้อมูลราคาและบทวิเคราะห์หุ้น Real-Time / StockHomeTH Pool]:
<current_market_data>
ข้อมูล ณ วันที่: ${formattedNowDate} เวลา: ${formattedNowTime}
Ticker: ${liveStock.ticker}
Company: ${liveStock.name}
Exchange: ${liveStock.market === 'SET' ? 'Stock Exchange of Thailand (SET)' : 'US Stock Market (NASDAQ/NYSE)'}
Current_Price: ${currencySymbol}${liveStock.price.toLocaleString()} (${liveStock.change >= 0 ? '+' : ''}${liveStock.change}%)
Day_Range: 52w Low ${currencySymbol}${liveStock.low52w || '—'} - 52w High ${currencySymbol}${liveStock.high52w || '—'}
Market_Cap: ${liveStock.marketCap}
P/E_Ratio: ${liveStock.peRatio ? liveStock.peRatio + 'x' : '—'}
Dividend_Yield: ${liveStock.dividendYield ? liveStock.dividendYield + '%' : '—'}
Volume: ${liveStock.volume || '—'}
Industry_Sector: ${liveStock.sector || 'บริษัทจดทะเบียนในตลาดหลักทรัพย์'}
Valuation_Verdict: ${valuationVerdict} [Rating: ${rating}${target}]
Technical_Trend: ${technicalTrend}
Key_Strengths: ${strengthsList}
Risks_To_Watch: ${risksList}
Pre_Analysis_Insight: ${liveStock.aiInsight || '—'}
Data_Pool_Status: ${liveStock.analysisStatus || 'completed'} (StockHomeTH Multi-Layer Resilient Pool)
</current_market_data>`;
      } else if (candidateTickers.length > 0 && !macroContext) {
        isLiveStockRAG = true;
        liveMarketDataBlock += `\n[ข้อมูลราคาหุ้นปัจจุบันจากตลาดหลักทรัพย์]:
<current_market_data>
Ticker: ${activeTicker || candidateTickers[0]}
Status: ข้อมูลอยู่ในกระบวนการซิงค์ของ StockHomeTH Pool (สามารถวิเคราะห์ภาพรวมธุรกิจ โครงสร้างรายได้ และปัจจัยพื้นฐานทั่วไปได้)
</current_market_data>`;
      }
    } catch (err) {
      console.warn('[RAG Stock / Macro Fetch Error]:', err);
    }

    // 3.6 Always-Present Platform Knowledge Context
    const PLATFORM_KNOWLEDGE_BLOCK = `[ข้อมูลปัจจุบันจากเว็บไซต์ - StockHomeTH Platform Facts]:
- บริบทระบบ: StockHomeTH เว็บไซต์พอร์ทัลวิเคราะห์หุ้นไทย (SET / mai) และหุ้นสหรัฐฯ (NASDAQ / NYSE) ครบวงจร
- วันที่และเวลาปัจจุบัน: ${formattedNowDate} เวลา ${formattedNowTime} (อิงตามเวลาประเทศไทย Asia/Bangkok)
- การใช้เหรียญ GemCoins:
  * สมาชิกที่ล็อกอินจะได้รับฟรี 500 GemCoins ทุกวัน (ระบบรีเซ็ตเวลาเที่ยงคืน 00:00 น. ของทุกวัน)
  * ผู้ใช้ทั่วไปที่เป็น Guest (ยังไม่เข้าสู่ระบบ) จะไม่สามารถส่งข้อความหา AI ได้ ต้องล็อกอินก่อน
  * การส่งข้อความแต่ละครั้งจะตัด GemCoins ตามโมเดลที่เลือก (เช่น Fast Models ใช้ ~15-25 เหรียญ, High-Tier Intelligence ใช้ตามความซับซ้อน)
- แพ็กเกจเติมเหรียญ GemCoins (Top-Up Packages):
  1. งบน้อย: ราคา 19 บาท (ปกติ 39 บาท) ได้รับ 1,500 GemCoins
  2. พอมีเงิน: ราคา 39 บาท (ปกติ 69 บาท) ได้รับ 3,500 + โบนัส 500 = 4,000 GemCoins
  3. มีตังค์เหลือๆ (ยอดนิยม): ราคา 89 บาท (ปกติ 149 บาท) ได้รับ 9,000 + โบนัส 1,500 = 10,500 GemCoins
  4. พร้อมบวก: ราคา 199 บาท (ปกติ 349 บาท) ได้รับ 25,000 + โบนัส 5,000 = 30,000 GemCoins
  5. เสี่ยสั่งลุย: ราคา 499 บาท (ปกติ 890 บาท) ได้รับ 70,000 + โบนัส 15,000 = 85,000 GemCoins
  6. เจ้าสัวพอร์ตโต: ราคา 999 บาท (ปกติ 1,790 บาท) ได้รับ 150,000 + โบนัส 40,000 = 190,000 GemCoins
  7. ป๋าบุญทุ่ม: ราคา 1,999 บาท (ปกติ 3,590 บาท) ได้รับ 350,000 + โบนัส 100,000 = 450,000 GemCoins
  8. วาฬสถาบัน (Whale God - คุ้มค่าสูงสุด): ราคา 3,999 บาท (ปกติ 6,990 บาท) ได้รับ 800,000 + โบนัส 250,000 = 1,050,000 GemCoins
- แพลนสมาชิกรายเดือน (Subscription Tiers):
  * Free Plan: 0 บาท ได้รับ 500 GemCoins/วัน ทุกเที่ยงคืน ตลอดชีพ
  * Lite Plan: 89 บาท/เดือน (หรือรายปี 890 บาท) ได้รับ 2,500 GemCoins/วัน + แถมเหรียญถาวร 12,000 GemCoins
  * Pro Plan: 299 บาท/เดือน (หรือรายปี 2,990 บาท) ได้รับ 10,000 GemCoins/วัน + แถมเหรียญถาวร 45,000 GemCoins + Real-time Stock Context
  * VIP Investor: 999 บาท/เดือน (หรือรายปี 9,990 บาท) ได้รับ 50,000 GemCoins/วัน + แถมเหรียญถาวร 180,000 GemCoins + Deep Reasoning Analysis
- ฟังก์ชันหลักบนเว็บไซต์:
  * หน้าหลัก / ตลาด: ดัชนี SET, SET50, หุ้นยอดนิยม, หุ้น Top Gainers / Losers
  * คัดกรองหุ้น (Stock Screener): กรองหุ้นตามตัวชี้วัด P/E, P/BV, เงินปันผล, Market Cap, ภาคธุรกิจ
  * กราฟเทคนิคและข้อมูลงบการเงินย้อนหลัง
  * AI Helper: แชตบอตวิเคราะห์หุ้น เจาะลึกงบ และตอบคำถามการลงทุน`;

    // 4. Build System Prompt with Financial Context & Rolling Summary
    let systemPromptWithContext = COMPACT_SYSTEM_PROMPT;
    systemPromptWithContext += `\n\n${PLATFORM_KNOWLEDGE_BLOCK}`;

    if (isLiveStockRAG) {
      systemPromptWithContext += `\n\n${STRICT_ANCHORING_LORE}`;
    } else if (stockContext && stockContext.ticker) {
      systemPromptWithContext += `\n\n[ข้อมูลหุ้นปัจจุบันจากเว็บไซต์]:\n[บริบทหุ้น]: ${stockContext.ticker} (${stockContext.market || 'SET'}) ราคา: ${stockContext.price ?? '—'} (${stockContext.change != null ? (stockContext.change >= 0 ? '+' : '') + stockContext.change + '%' : '—'}) PE: ${stockContext.peRatio ?? '—'}x มาร์เก็ตแคป: ${stockContext.marketCap ?? '—'}`;
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

      if (isLatestUser) {
        let textContent = msg.content;

        // Inject live market data delimiter block if RAG is active
        if (isLiveStockRAG && liveMarketDataBlock) {
          textContent = `${liveMarketDataBlock}\n\nคำถามจากผู้ใช้: "${msg.content}"`;
        }

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

    // Enable OpenRouter Prompt Caching structure: System Lore & Financial Grounding is placed at top with cache control hints
    const requestPayload = {
      model,
      models: fallbackArray,
      route: 'fallback',
      messages: formattedMessages.map((m, idx) => {
        // System message or initial system lore is candidate for prompt caching
        if (m.role === 'system' || idx === 0) {
          return {
            ...m,
            cache_control: { type: 'ephemeral' },
          };
        }
        return m;
      }),
      temperature: isLiveStockRAG ? 0.1 : 0.7,
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

            // Cache response if eligible (not real-time stock RAG and not refusal)
            if (!hasAttachments && !isLiveStockRAG && accumulatedText && !accumulatedText.includes('ไม่พบข้อมูล')) {
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

    // Cache response in both Semantic Cache and OpenRouter Guard Service Cache
    if (!hasAttachments && !replyContent.includes('ไม่พบข้อมูล')) {
      recordOpenRouterRequest(isRealUser);
      setCachedChatResponse(cacheKey, replyContent, actualModel);
      await setSemanticCachedResponse(lastUserMsg, replyContent, actualModel, activeTicker || undefined);
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
