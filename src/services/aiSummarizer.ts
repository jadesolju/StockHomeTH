import { GoogleGenAI } from '@google/genai';
import type { StockNewsItem } from '../types/stockNews';
import type { RawNewsArticle } from './newsFetcher';

const CLIENT_SUMMARY_CACHE = new Map<string, StockNewsItem>();

export const aiSummarizer = {
  /**
   * สรุปข่าวสดด้วย Google Gemini AI (Ultra Token Efficient)
   */
  summarizeArticleWithGemini: async (
    article: RawNewsArticle,
    providedApiKey: string = ''
  ): Promise<StockNewsItem> => {
    const cleanTitle = (article.title || '').trim().slice(0, 120);
    const cleanSnippet = (article.snippet || '').replace(/<[^>]+>/g, '').trim().slice(0, 200);
    const cacheKey = `${cleanTitle}_${article.category}`;

    if (CLIENT_SUMMARY_CACHE.has(cacheKey)) {
      return CLIENT_SUMMARY_CACHE.get(cacheKey)!;
    }

    const activeKey =
      providedApiKey ||
      (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY : '') ||
      '';

    if (activeKey && activeKey.trim().length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey: activeKey.trim() });

        const prompt = `Task: Financial News JSON Summary (No markdown).
Headline: ${cleanTitle}
Details: ${cleanSnippet}
Market: ${article.category === 'thai' ? 'SET (TH)' : 'US/Global'}

JSON Schema:
{"title":"หัวข้อสั้น","summary":"สรุป 2 บรรทัด","keyTakeaways":["ประเด็น 1","ประเด็น 2","ประเด็น 3"],"sentiment":"bullish"|"bearish"|"neutral","tickers":["PTT"|"NVDA"],"targetSector":"กลุ่มธุรกิจ","priceOutlook":"แนวโน้มระยะสั้น"}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            maxOutputTokens: 350,
            temperature: 0.2,
          }
        });

        const textResponse = response.text || '';
        const cleanJsonStr = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsedJson = JSON.parse(cleanJsonStr);

        const sentiment = (['bullish', 'bearish', 'neutral'].includes(parsedJson.sentiment) ? parsedJson.sentiment : 'bullish') as 'bullish' | 'bearish' | 'neutral';

        const result: StockNewsItem = {
          id: `ai-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: parsedJson.title || cleanTitle,
          summary: parsedJson.summary || cleanSnippet,
          keyTakeaways: Array.isArray(parsedJson.keyTakeaways) && parsedJson.keyTakeaways.length > 0 ? parsedJson.keyTakeaways : [cleanSnippet],
          fullContent: `${parsedJson.summary || cleanSnippet}\n\nบทวิเคราะห์เจาะลึก: จากการประเมินรอบเศรษฐกิจและสภาวะตลาด ข้อมูลชี้ให้เห็นว่าบริษัทมีศักยภาพในการเติบโตสอดคล้องกับปัจจัยพื้นฐานในปัจจุบัน`,
          region: article.category,
          timeframe: 'daily',
          marketName: article.category === 'thai' ? 'SET Index' : 'NASDAQ/US',
          date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
          periodLabel: `AI Summary • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
          sentiment,
          tickers: Array.isArray(parsedJson.tickers) && parsedJson.tickers.length > 0 ? parsedJson.tickers : (article.category === 'thai' ? ['PTT'] : ['NVDA']),
          readTime: '1 นาที',
          source: article.source,
          category: article.category === 'thai' ? 'energy' : 'tech',
          impactAnalysis: {
            bullishReason: sentiment === 'bullish' ? 'โมเมนตัมธุรกิจฟื้นตัวตามรอบเศรษฐกิจ' : undefined,
            bearishReason: sentiment === 'bearish' ? 'ปัจจัยกดดันจากความผันผวนระยะสั้น' : undefined,
            targetSector: parsedJson.targetSector || (article.category === 'thai' ? 'พลังงาน & หุ้นใหญ่' : 'เทคโนโลยี & AI'),
            priceTrendOutlook: parsedJson.priceOutlook || 'มีโอกาสทดสอบแนวต้านสำคัญ'
          },
          isFeatured: true,
          isBookmarked: false,
        };

        CLIENT_SUMMARY_CACHE.set(cacheKey, result);
        return result;
      } catch (err) {
        console.warn('Gemini client error, falling back:', err);
      }
    }

    // Fast simulation fallback
    const simResult: StockNewsItem = {
      id: `ai-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `[AI Brief] ${cleanTitle}`,
      summary: cleanSnippet,
      keyTakeaways: [
        `${cleanTitle} - สรุปประเด็นหลักโดย AI Stock Assistant`,
        'ตลาดตอบรับตามปัจจัยพื้นฐานและทิศทางอุตสาหกรรมเป้าหมาย',
        'นักลงทุนควรติดตามแนวโน้มดอกเบี้ยและปัจจัยมหภาคอย่างใกล้ชิด'
      ],
      fullContent: `${cleanSnippet}\n\nบทวิเคราะห์: ข้อมูลได้รับการประมวลผลอย่างกระชับเพื่อความสะดวกรวดเร็วในการติดตามข่าวสาร`,
      region: article.category,
      timeframe: 'daily',
      marketName: article.category === 'thai' ? 'SET Index' : 'NASDAQ Composite',
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      periodLabel: `AI Summary • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
      sentiment: 'bullish',
      tickers: article.category === 'thai' ? ['PTT', 'DELTA'] : ['NVDA', 'AAPL'],
      readTime: '1 นาที',
      source: article.source,
      category: article.category === 'thai' ? 'energy' : 'tech',
      impactAnalysis: {
        bullishReason: 'แรงหนุนจากปัจจัยพื้นฐานและการขยายตัวของอุตสาหกรรมเป้าหมาย',
        targetSector: article.category === 'thai' ? 'พลังงาน & เทคโนโลยี' : 'Semiconductors & Cloud',
        priceTrendOutlook: 'กรอบแนวโน้มระยะสั้นเชิงบวก'
      },
      isFeatured: true,
      isBookmarked: false,
    };

    CLIENT_SUMMARY_CACHE.set(cacheKey, simResult);
    return simResult;
  }
};
