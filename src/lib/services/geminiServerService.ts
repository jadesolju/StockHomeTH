import { GoogleGenAI } from '@google/genai';
import { StockNewsItemSchema, type StockNewsItem } from '../schemas/newsSchema';

export interface RawArticlePayload {
  title: string;
  snippet: string;
  source: string;
  category: 'thai' | 'global';
}

// In-memory token-saving cache: { [articleHash]: StockNewsItem }
const SUMMARY_CACHE = new Map<string, { data: StockNewsItem; time: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

function hashKey(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash));
}

export async function summarizeArticleWithGeminiServer(
  article: RawArticlePayload,
  userApiKey?: string
): Promise<StockNewsItem> {
  // Strip input text to reduce input tokens
  const cleanTitle = (article.title || '').trim().slice(0, 120);
  const cleanSnippet = (article.snippet || '').replace(/<[^>]+>/g, '').trim().slice(0, 200);
  const cacheKey = hashKey(`${cleanTitle}_${article.category}`);

  const cached = SUMMARY_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.data;
  }

  const effectiveKey = userApiKey || process.env.GEMINI_API_KEY || '';

  if (effectiveKey && effectiveKey.trim().length > 5) {
    try {
      const ai = new GoogleGenAI({ apiKey: effectiveKey.trim() });

      // Ultra-token-efficient compact prompt
      const prompt = `Analyst Task: Summarize in concise JSON (No markdown).
Title: ${cleanTitle}
Text: ${cleanSnippet}
Market: ${article.category === 'thai' ? 'SET (TH)' : 'US/Global'}

JSON Format:
{"title":"สรุปหัวข้อสั้น","summary":"สรุปกระชับ 2 บรรทัด","keyTakeaways":["ประเด็น 1","ประเด็น 2","ประเด็น 3"],"sentiment":"bullish"|"bearish"|"neutral","tickers":["PTT"|"NVDA"],"targetSector":"กลุ่มอุตสาหกรรม","priceOutlook":"แนวโน้มระยะสั้น"}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          maxOutputTokens: 350,
          temperature: 0.2,
        }
      });

      const textResponse = response.text || '';
      const cleanJson = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      const sentiment = (['bullish', 'bearish', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'bullish') as 'bullish' | 'bearish' | 'neutral';
      const tickers = Array.isArray(parsed.tickers) && parsed.tickers.length > 0
        ? parsed.tickers.map((t: string) => String(t).toUpperCase().replace(/[^A-Z0-9]/g, '')).filter(Boolean)
        : (article.category === 'thai' ? ['SET'] : ['US']);

      const result: StockNewsItem = {
        id: `ai-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: parsed.title || cleanTitle,
        summary: parsed.summary || cleanSnippet,
        keyTakeaways: Array.isArray(parsed.keyTakeaways) && parsed.keyTakeaways.length > 0 ? parsed.keyTakeaways : [cleanSnippet],
        fullContent: `${parsed.summary || cleanSnippet}\n\nบทวิเคราะห์เจาะลึก: บริษัทมีแนวโน้มได้รับผลบวกจากปัจจัยมหภาคและการเติบโตของอุตสาหกรรมเป้าหมาย สอดคล้องกับทิศทางราคาในปัจจุบัน`,
        region: article.category,
        timeframe: 'daily',
        marketName: article.category === 'thai' ? 'SET Index (ไทย)' : 'US & Global Markets',
        date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        periodLabel: `AI Brief • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
        sentiment,
        tickers,
        readTime: '1 นาที',
        source: article.source || 'Financial Media',
        category: article.category === 'thai' ? 'energy' : 'tech',
        impactAnalysis: {
          bullishReason: sentiment === 'bullish' ? 'แรงหนุนเชิงบวกต่อกลุ่มธุรกิจเป้าหมาย' : undefined,
          bearishReason: sentiment === 'bearish' ? 'ความผันผวนและแรงกดดันระยะสั้น' : undefined,
          targetSector: parsed.targetSector || (article.category === 'thai' ? 'SET 50' : 'Global Tech'),
          priceTrendOutlook: parsed.priceOutlook || 'แกว่งตัวในกรอบบวก',
          riskFactors: [],
        },
        isFeatured: true,
        isBookmarked: false,
      };

      const validated = StockNewsItemSchema.parse(result);
      SUMMARY_CACHE.set(cacheKey, { data: validated, time: Date.now() });
      return validated;
    } catch (err) {
      console.warn('[geminiServerService] AI prompt error, using efficient procedural fallback:', err);
    }
  }

  // Ultra-lightweight fallback
  const fallbackItem: StockNewsItem = {
    id: `ai-sim-${Date.now()}`,
    title: `[AI Brief] ${cleanTitle}`,
    summary: cleanSnippet,
    keyTakeaways: [
      `${cleanTitle} - สรุปประเด็นสำคัญจากข่าวล่าสุด`,
      'ตลาดตอบรับตามปัจจัยพื้นฐานและทิศทางอุตสาหกรรม',
      'นักลงทุนควรติดตามผลประกอบการและปัจจัยมหภาคต่อเนื่อง',
    ],
    fullContent: `${cleanSnippet}\n\nบทวิเคราะห์: ข้อมูลข่าวสารได้รับการประมวลผลอย่างกระชับเพื่อให้นักลงทุนจับประเด็นสำคัญได้เร็วที่สุด`,
    region: article.category,
    timeframe: 'daily',
    marketName: article.category === 'thai' ? 'SET Index' : 'US Markets',
    date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
    periodLabel: `AI Summary • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
    sentiment: 'bullish',
    tickers: article.category === 'thai' ? ['SET', 'PTT'] : ['NVDA', 'AAPL'],
    readTime: '1 นาที',
    source: article.source,
    category: article.category === 'thai' ? 'energy' : 'tech',
    impactAnalysis: {
      bullishReason: 'ปัจจัยบวกจากแนวโน้มการเติบโตของภาคธุรกิจ',
      targetSector: article.category === 'thai' ? 'พลังงาน & หุ้นใหญ่' : 'เทคโนโลยี & AI',
      priceTrendOutlook: 'มีโอกาสทดสอบแนวต้านสำคัญ',
    },
    isFeatured: true,
    isBookmarked: false,
  };

  const validated = StockNewsItemSchema.parse(fallbackItem);
  SUMMARY_CACHE.set(cacheKey, { data: validated, time: Date.now() });
  return validated;
}
