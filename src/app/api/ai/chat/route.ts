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
import { fetchSingleStockYFinance } from '@/lib/services/yfinanceBridge';
import { SET100_TICKERS, THAI_7_GIANTS, MAGNIFICENT_7 } from '@/lib/utils/stockTagHelper';

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

// Core System Prompt for StockHome AI Agent based on accurate grounding
const COMPACT_SYSTEM_PROMPT = `คุณคือ AI Agent ผู้ช่วยอัจฉริยะประจำเว็บไซต์ StockHomeTH แพลตฟอร์มศูนย์รวมข้อมูลหุ้นไทยและตลาดสากล

[กฎเกณฑ์และแนวทางการตอบ]:
1. ข้อเท็จจริงของระบบและราคาหุ้นล่าสุด: สำหรับราคาหุ้นปัจจุบัน, วันที่/เวลา, สถานะตลาด และข้อมูลแพ็กเกจ/ฟีเจอร์ของเว็บไซต์ StockHomeTH ให้อ้างอิงจากส่วน [ข้อมูลปัจจุบันจากเว็บไซต์] เป็นหลักเสมอ ห้ามกุราคาหุ้นหรือเดาตัวเลขทางการเงินเอง
2. ความรู้และการวิเคราะห์การลงทุน: สำหรับคำถามเชิงความรู้ (เช่น ความหมายของ P/E, P/BV, กลยุทธ์ DCA, การวิเคราะห์งบการเงิน, หุ้นปันผล, เศรษฐกิจมหภาค) หรือคำถามแนะนำการใช้งานเว็บไซต์ คุณสามารถอธิบาย แนะนำ และให้ความรู้ได้อย่างละเอียด ชัดเจน เข้าใจง่าย และถูกต้องตามหลักการเงิน
3. หากไม่พบราคาหุ้นแบบเรียลไทม์: หากผู้ใช้ถามราคาหุ้นที่ไม่พบใน [ข้อมูลปัจจุบันจากเว็บไซต์] ให้แจ้งอย่างสุภาพว่าระบบยังไม่มีข้อมูลราคาล่าสุดของหุ้นตัวนั้น พร้อมแนะนำให้ระบุชื่อย่อภาษาอังกฤษ (Ticker) เพื่อการค้นหาที่แม่นยำ
4. รักษาโทนเสียงที่เป็นมิตร กระชับ และสุภาพ ให้สมกับเป็น AI ผู้เชี่ยวชาญการลงทุนประจำ StockHomeTH
5. การเชื่อมโยงหัวข้อ (Smart Financial Pivot): หากผู้ใช้ถามเรื่องทั่วไป เช่น บันเทิง ภาพยนตร์ กีฬา ท่องเที่ยว อาหาร หรือไลฟ์สไตล์ ให้ตอบคลายข้อสงสัยสั้นๆ 1 ประโยค แล้วเชื่อมโยงเข้าสู่มุมมองหุ้น ธุรกิจ หรือการลงทุนที่เกี่ยวข้อง โดยต้องยกตัวอย่างเฉพาะหุ้นที่มีการจดทะเบียนซื้อขายจริงในตลาดหลักทรัพย์ SET/mai หรือตลาดสหรัฐฯ เท่านั้น **ห้ามกุหรือคิดชื่อบริษัทขึ้นมาเอง และห้ามแต่งตั้งบริษัทเอกชนหรือร้านค้าทั่วไปให้เป็น "บมจ." เด็ดขาด** (เช่น ร้านทองฮั่วเซ่งเฮงไม่ใช่ บมจ. ในตลาดหลักทรัพย์ หากพูดถึงทองคำให้โยงไปหุ้นโรงรับจำนำที่มีจริง เช่น MTC, SAWAD หรือร้านทองจดทะเบียน AURA เป็นต้น)
6. ความสมบูรณ์ของคำตอบ: ไม่พรรณนาเยิ่นเย้อ กระชับ ตรงไปตรงมา ไม่มีคำทักทายซ้ำซาก ตอบประเด็นให้จบสมบูรณ์ทุกครั้ง ห้ามตัดจบประโยคกลางคัน
7. DYOR: ปิดท้ายสั้นๆ 1 บรรทัดเสมอว่า "การลงทุนมีความเสี่ยง ข้อมูลนี้จัดทำขึ้นเพื่อการศึกษาและการวิเคราะห์ ไม่ใช่คำชี้ชวนในการซื้อขายหลักทรัพย์"`;

// Strict Anchoring System Lore for Real-Time Stock RAG
const STRICT_ANCHORING_LORE = `[โหมดวิเคราะห์หุ้น Real-Time (Strict Grounding & Anchoring)]
คุณคือ "ผู้เชี่ยวชาญด้านการวิเคราะห์หุ้น" ประจำเว็บไซต์ StockHomeTH ที่ทำหน้าที่วิเคราะห์ปัจจัยพื้นฐานจากข้อมูลปัจจุบันที่ส่งให้เท่านั้น

[กฎเหล็ก]
1. ต้องตอบราคาและรายละเอียดของหุ้นจากข้อมูลในส่วน [ข้อมูลราคาหุ้นปัจจุบันจากตลาดหลักทรัพย์] เสมอ
2. ห้ามใช้ความรู้เดิมเรื่องราคา หรือเดาราคาเอง หากไม่มีข้อมูลราคาให้แจ้งว่า "ไม่พบข้อมูลดังกล่าวในขณะนี้"
3. อ้างอิงวันที่และเวลาที่ระบุในข้อมูลดิบเสมอ เพื่อชี้แจงให้ผู้ใช้ทราบว่าเป็นข้อมูล ณ เวลาใด
4. ห้ามแต่งตั้งหรือกุชื่อบริษัทขึ้นมาเองโดยเด็ดขาด

[โครงสร้างรูปแบบการจัดรูปแบบผลลัพธ์ (Output Format)]
ให้ตอบกลับตามหัวข้อดังนี้อย่างชัดเจน เป็นระเบียบ:
- [ข้อมูลราคาหุ้น {TICKER}]
- ราคาหุ้น {COMPANY_NAME} ({TICKER}) - ตลาด {EXCHANGE}
- ราคาปัจจุบัน: ประมวลจากตัวเลขล่าสุด พร้อมระบุความเคลื่อนไหว (%)
- สถานะปัจจุบัน: สรุปกลุ่มอุตสาหกรรมและกระแสหลัก
- ปัจจัยสนับสนุน: ระบุความต้องการสินค้าหรือข่าวสารหลักจากข้อมูลที่ให้
- ประเด็นต้องติดตาม: สรุปความเสี่ยงและเรื่องที่ต้องจับตาดูถัดไป`;

// Common stop words to prevent false positives when searching uppercase tickers
const COMMON_IGNORE_WORDS = new Set([
  'AI', 'THE', 'AND', 'FOR', 'NOT', 'BUT', 'BUY', 'SELL', 'CAN', 'MAY', 'NEW',
  'NOW', 'TOP', 'ALL', 'SEE', 'DAY', 'GET', 'HAS', 'HAD', 'ARE', 'WAS', 'PER',
  'NET', 'LOW', 'RUN', 'SET', 'THB', 'USD', 'CEO', 'CFO', 'EPS', 'GDP', 'FED',
  'BOT', 'SEC', 'IPO', 'FREE', 'PRO', 'VIP', 'CHAT', 'HELP', 'WHAT', 'HOW',
  'WHEN', 'WHERE', 'WHY', 'WHO', 'WILL', 'WITH', 'FROM', 'HAVE', 'THIS', 'THAT',
  'LITE', 'TRUE', 'REAL', 'TIME', 'GOOD', 'BAD', 'HOLD', 'INFO', 'DOC'
]);

// Mapping Thai names, brand names, and vernacular terms to official stock tickers
const THAI_STOCK_MAP: Record<string, string> = {
  // SET Energy & Utilities
  'ปตท.': 'PTT',
  'ปตท': 'PTT',
  'ปตทสผ': 'PTTEP',
  'ปตท.สผ': 'PTTEP',
  'สผ': 'PTTEP',
  'ไทยออยล์': 'TOP',
  'ท็อป': 'TOP',
  'บางจาก': 'BCP',
  'บีซีพี': 'BCP',
  'พีทีทีจีซี': 'PTTGC',
  'ไออาร์พีซี': 'IRPC',
  'กัลฟ์': 'GULF',
  'กัลฟ์เอ็นเนอร์จี': 'GULF',
  'บีกริม': 'BGRIM',
  'ราชบุรี': 'RATCH',
  'ผลิตไฟฟ้า': 'EGCO',
  'บ้านปู': 'BANPU',
  'ดับบลิวเอชเอ': 'WHA',
  'โออาร์': 'OR',
  'ปตทโออาร์': 'OR',
  'อีเอ': 'EA',

  // SET Banking & Finance
  'กสิกรไทย': 'KBANK',
  'กสิกร': 'KBANK',
  'เคแบงก์': 'KBANK',
  'ไทยพาณิชย์': 'SCB',
  'เอสซีบี': 'SCB',
  'กรุงเทพ': 'BBL',
  'แบงก์กรุงเทพ': 'BBL',
  'กรุงไทย': 'KTB',
  'กรุงศรี': 'BAY',
  'ทีทีบี': 'TTB',
  'ทหารไทยธนชาต': 'TTB',
  'ทิสโก้': 'TISCO',
  'เกียรตินาคิน': 'KKP',
  'สวัสดิ์': 'SAWAD',
  'ศรีสวัสดิ์': 'SAWAD',
  'เมืองไทยแคป': 'MTC',
  'เมืองไทยแคปปิตอล': 'MTC',
  'เงินติดล้อ': 'TIDLOR',
  'ติดล้อ': 'TIDLOR',
  'เจเอ็มที': 'JMT',
  'แบม': 'BAM',

  // SET Commerce & Retail
  'ซีพีออลล์': 'CPALL',
  'ซีพีออล': 'CPALL',
  'เซเว่น': 'CPALL',
  'เซเว่นอีเลฟเว่น': 'CPALL',
  'ซีพีแอ็กซ์ตร้า': 'CPAXT',
  'แม็คโคร': 'CPAXT',
  'โลตัส': 'CPAXT',
  'เซ็นทรัลรีเทล': 'CRC',
  'โฮมโปร': 'HMPRO',
  'บิ๊กซี': 'BJC',
  'เบอร์ลี่ยุคเกอร์': 'BJC',
  'คอมเซเว่น': 'COM7',
  'เจมาร์ท': 'JMART',
  'สยามโกลบอล': 'GLOBAL',
  'ดูโฮม': 'DOHOME',

  // SET ICT & Tech
  'แอดวานซ์': 'ADVANC',
  'เอไอเอส': 'ADVANC',
  'ทรู': 'TRUE',
  'เดลต้า': 'DELTA',
  'ฮานา': 'HANA',
  'เคซีอี': 'KCE',
  'ซีซีอีที': 'CCET',

  // SET Healthcare & Tourism & Transport
  'การท่า': 'AOT',
  'สนามบิน': 'AOT',
  'การท่าอากาศยาน': 'AOT',
  'กรุงเทพดุสิต': 'BDMS',
  'บีดีเอ็มเอส': 'BDMS',
  'บำรุงราษฎร์': 'BH',
  'โรงพยาบาลจุฬารัตน์': 'CHG',
  'บางกอกเชน': 'BCH',
  'บีทีเอส': 'BTS',
  'รถไฟฟ้า': 'BEM',
  'บีอีเอ็ม': 'BEM',
  'ไมเนอร์': 'MINT',
  'ดิเอราวัณ': 'ERW',
  'เซ็นทรัลพัฒนา': 'CPN',
  'ออโรร่า': 'AURA',
  'ร้านทองออโรร่า': 'AURA',

  // SET Food & Industrial
  'ซีพีเอฟ': 'CPF',
  'เจริญโภคภัณฑ์อาหาร': 'CPF',
  'ไทยยูเนี่ยน': 'TU',
  'คาราบาว': 'CBG',
  'โอสถสภา': 'OSP',
  'อิชิตัน': 'ICHI',
  'เซ็ปเป้': 'SAPPE',
  'ปูนใหญ่': 'SCC',
  'เอสซีจี': 'SCC',
  'เอสซีจีแพคเกจจิ้ง': 'SCGP',

  // US Giants
  'เทสล่า': 'TSLA',
  'เทสลา': 'TSLA',
  'แอปเปิ้ล': 'AAPL',
  'แอปเปิล': 'AAPL',
  'ไมโครซอฟท์': 'MSFT',
  'กูเกิล': 'GOOGL',
  'อัลฟาเบท': 'GOOGL',
  'อินวิเดีย': 'NVDA',
  'เอ็นวิเดีย': 'NVDA',
  'อเมซอน': 'AMZN',
  'เมต้า': 'META',
  'เฟสบุ๊ก': 'META',
  'เน็ตฟลิกซ์': 'NFLX',

  // Commodities & Crypto
  'ทองคำ': 'GLD',
  'ทอง': 'GLD',
  'บิทคอยน์': 'BTC-USD',
  'บิตคอยน์': 'BTC-USD',
  'อีเธอเรียม': 'ETH-USD',
  'อีเทอเรียม': 'ETH-USD',
};

function extractCandidateTickers(text: string): string[] {
  if (!text) return [];
  const candidates: string[] = [];
  const lowerText = text.toLowerCase();

  // 1. Check Thai stock map (sorted by descending length to match longest word first e.g. "ปตทสผ" before "ปตท")
  const sortedThaiKeys = Object.keys(THAI_STOCK_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedThaiKeys) {
    if (text.includes(key) || lowerText.includes(key.toLowerCase())) {
      const mapped = THAI_STOCK_MAP[key];
      if (!candidates.includes(mapped)) {
        candidates.push(mapped);
      }
    }
  }

  // 2. Pattern: $TICKER (e.g. $NVDA, $DELTA, $PTT)
  const dollarMatches = text.match(/\$([A-Za-z]{1,6})\b/g);
  if (dollarMatches) {
    for (const m of dollarMatches) {
      const sym = m.replace('$', '').toUpperCase().trim();
      if (!COMMON_IGNORE_WORDS.has(sym) && !candidates.includes(sym)) candidates.push(sym);
    }
  }

  // 3. Pattern: หุ้น [TICKER] or หุ้นไทย [TICKER]
  const thaiMatches = text.match(/(?:หุ้น|ราคาหุ้น|วิเคราะห์หุ้น|หุ้นไทย)\s*([A-Za-z]{1,6})\b/gi);
  if (thaiMatches) {
    for (const m of thaiMatches) {
      const sym = m.replace(/(?:หุ้น|ราคาหุ้น|วิเคราะห์หุ้น|หุ้นไทย)\s*/i, '').toUpperCase().trim();
      if (!COMMON_IGNORE_WORDS.has(sym) && !candidates.includes(sym)) candidates.push(sym);
    }
  }

  // 4. Standalone English tokens (e.g. NVDA, PTT, CPALL, DELTA, TSLA, AAPL, MSFT, ptt, delta)
  const standaloneMatches = text.match(/\b([A-Za-z]{2,6})\b/g);
  if (standaloneMatches) {
    for (const sym of standaloneMatches) {
      const clean = sym.toUpperCase().trim();
      if (!COMMON_IGNORE_WORDS.has(clean) && !candidates.includes(clean)) {
        const isUpper = sym === clean;
        const isRecognizedStock =
          SET100_TICKERS.has(clean) ||
          THAI_7_GIANTS.has(clean) ||
          MAGNIFICENT_7.has(clean) ||
          clean === 'BTC' ||
          clean === 'ETH' ||
          clean === 'GLD';

        if (isUpper || isRecognizedStock) {
          const mapped = clean === 'BTC' ? 'BTC-USD' : clean === 'ETH' ? 'ETH-USD' : clean;
          if (!candidates.includes(mapped)) {
            candidates.push(mapped);
          }
        }
      }
    }
  }

  return Array.from(new Set(candidates));
}

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
    const candidateTickers = extractCandidateTickers(lastUserMsg);
    const activeTicker = stockContext?.ticker || (candidateTickers.length > 0 ? candidateTickers[0] : null);

    const cacheKey = getChatCacheKey(model, lastUserMsg);

    // Only serve from cache if not an active stock quote query and not streaming/multimodal
    if (!hasAttachments && !stream && !activeTicker) {
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

    // 3.5 Real-Time Stock RAG & Grounding Data Retrieval
    let isLiveStockRAG = false;
    let liveMarketDataBlock = '';

    const now = new Date();
    const formattedNowDate = now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const formattedNowTime = now.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }) + ' น.';

    if (activeTicker) {
      try {
        const liveStock = await fetchSingleStockYFinance(activeTicker, stockContext?.market, true);
        if (liveStock) {
          isLiveStockRAG = true;
          const currencySymbol = liveStock.currency === 'THB' ? '฿' : '$';

          liveMarketDataBlock = `[ข้อมูลราคาหุ้นปัจจุบันจากตลาดหลักทรัพย์]:
<current_market_data>
ข้อมูล ณ วันที่: ${formattedNowDate} เวลา: ${formattedNowTime}
Ticker: ${liveStock.ticker}
Company: ${liveStock.name}
Exchange: ${liveStock.market === 'SET' ? 'Stock Exchange of Thailand (SET)' : 'US Stock Market (NASDAQ/NYSE)'}
Current_Price: ${currencySymbol}${liveStock.price.toLocaleString()} (${liveStock.change >= 0 ? '+' : ''}${liveStock.change}%)
Day_Range: 52w Low ${currencySymbol}${liveStock.low52w} - 52w High ${currencySymbol}${liveStock.high52w}
Market_Cap: ${liveStock.marketCap}
P/E_Ratio: ${liveStock.peRatio ? liveStock.peRatio + 'x' : '—'}
Dividend_Yield: ${liveStock.dividendYield ? liveStock.dividendYield + '%' : '—'}
Volume: ${liveStock.volume || '—'}
Industry_Status: ${liveStock.sector || 'บริษัทจดทะเบียนในตลาดหลักทรัพย์'}
Catalysts: ${liveStock.aiInsight || 'ความต้องการผลิตภัณฑ์และผลประกอบการรอบล่าสุด'}
Risks_To_Watch: ความผันผวนของตลาดสากล ปัจจัยมหภาค และอัตราดอกเบี้ย/อัตราแลกเปลี่ยน
</current_market_data>`;
        } else if (candidateTickers.length > 0) {
          isLiveStockRAG = true;
          liveMarketDataBlock = `[ข้อมูลราคาหุ้นปัจจุบันจากตลาดหลักทรัพย์]:
<current_market_data>
Ticker: ${activeTicker}
Status: ระบบไม่พบข้อมูลราคาหุ้นแบบ Real-time ของ ${activeTicker} ในขณะนี้ (สามารถวิเคราะห์ภาพรวมธุรกิจและปัจจัยพื้นฐานทั่วไปได้)
</current_market_data>`;
        }
      } catch (err) {
        console.warn('[RAG Stock Fetch Error]:', err);
      }
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

    const requestPayload = {
      model,
      models: fallbackArray,
      route: 'fallback',
      messages: formattedMessages,
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

    // Cache response if eligible (not real-time stock RAG and not refusal)
    if (!hasAttachments && !isLiveStockRAG && !replyContent.includes('ไม่พบข้อมูล')) {
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
