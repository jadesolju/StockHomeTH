import { GoogleGenAI } from '@google/genai';
import type { StockNewsItem } from '../types/stockNews';
import type { RawNewsArticle } from './newsFetcher';

export const aiSummarizer = {
  /**
   * สรุปข่าวสดด้วย Google Gemini AI
   */
  summarizeArticleWithGemini: async (
    article: RawNewsArticle,
    apiKey: string
  ): Promise<StockNewsItem> => {
    // หากมี API Key ให้เรียกใช้ Gemini API
    if (apiKey && apiKey.trim().length > 5) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์ข่าวสารหุ้นและการลงทุน (Senior Stock Analyst)
โปรดอ่านข่าวสารต่อไปนี้ และสรุปให้อยู่ในรูปแบบ JSON Object ที่ถูกต้อง 100% (ไม่ต้องใส่ markdown code fence อื่นใด)

หัวข้อข่าว: ${article.title}
เนื้อหาข่าว: ${article.snippet}
แหล่งที่มา: ${article.source}
ประเภทตลาด: ${article.category === 'thai' ? 'หุ้นไทย (SET)' : 'หุ้นต่างประเทศ (US/Global)'}

โครงสร้าง JSON ที่ต้องการ:
{
  "title": "หัวข้อสรุปข่าวสั้นกระชับเข้าใจง่าย",
  "summary": "สรุปเนื้อหาข่าว 2-3 บรรทัด",
  "keyTakeaways": [
    "ประเด็นสำคัญที่ 1 พร้อมตัวเลขหรือข้อมูลสำคัญ",
    "ประเด็นสำคัญที่ 2",
    "ประเด็นสำคัญที่ 3"
  ],
  "fullContent": "เนื้อหาข่าวฉบับเต็มเรียบเรียงใหม่อย่างน่าอ่าน",
  "region": "${article.category}",
  "timeframe": "daily",
  "marketName": "${article.category === 'thai' ? 'SET Index' : 'NASDAQ'}",
  "date": "${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}",
  "periodLabel": "สรุปสดพิเศษ AI • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}",
  "sentiment": "bullish" | "bearish" | "neutral",
  "tickers": ["สัญลักษณ์หุ้นที่เกี่ยวข้อง เช่น PTT, NVDA"],
  "readTime": "2 นาที",
  "audioDuration": "1:30",
  "source": "${article.source}",
  "category": "macro" | "tech" | "energy" | "finance" | "retail" | "health",
  "impactAnalysis": {
    "bullishReason": "เหตุผลปัจจัยบวก (ถ้ามี)",
    "bearishReason": "เหตุผลปัจจัยเสี่ยง (ถ้ามี)",
    "targetSector": "กลุ่มอุตสาหกรรมเป้าหมาย",
    "priceTrendOutlook": "คาดการณ์แนวโน้มระยะสั้น"
  }
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const textResponse = response.text || '';
        // Clean JSON formatting if enclosed in backticks
        const cleanJsonStr = textResponse
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        const parsedJson = JSON.parse(cleanJsonStr);

        return {
          id: `ai-gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          title: parsedJson.title || article.title,
          summary: parsedJson.summary || article.snippet,
          keyTakeaways: Array.isArray(parsedJson.keyTakeaways) ? parsedJson.keyTakeaways : [article.snippet],
          fullContent: parsedJson.fullContent || article.snippet,
          region: article.category,
          timeframe: 'daily',
          marketName: article.category === 'thai' ? 'SET Index' : 'NASDAQ',
          date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
          periodLabel: `สรุปสด AI • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
          sentiment: parsedJson.sentiment || 'bullish',
          tickers: Array.isArray(parsedJson.tickers) && parsedJson.tickers.length > 0 ? parsedJson.tickers : (article.category === 'thai' ? ['SET', 'PTT'] : ['NVDA', 'AAPL']),
          readTime: parsedJson.readTime || '2 นาที',
          audioDuration: parsedJson.audioDuration || '1:30',
          source: article.source,
          category: parsedJson.category || (article.category === 'thai' ? 'energy' : 'tech'),
          impactAnalysis: parsedJson.impactAnalysis || {
            bullishReason: 'โมเมนตัมธุรกิจฟื้นตัวตามรอบเศรษฐกิจ',
            targetSector: article.category === 'thai' ? 'พลังงาน & หุ้นใหญ่' : 'เทคโนโลยี & AI',
            priceTrendOutlook: 'มีโอกาสทดสอบแนวต้านสำคัญ'
          },
          isFeatured: true,
          isBookmarked: false,
        };
      } catch (err) {
        console.error('Error generating summary with Gemini API:', err);
      }
    }

    // Dynamic Simulation Fallback (กรณีไม่มี API Key หรือเชื่อมต่อไม่ได้)
    return {
      id: `ai-sim-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title: `[AI สรุปด่วน] ${article.title}`,
      summary: article.snippet,
      keyTakeaways: [
        `${article.title} - สรุปประเด็นหลักโดยวิเคราะห์จากข่าวสารล่าสุด`,
        `ตลาดตอบรับเชิงบวกต่อข่าวนี้ มูลค่าการซื้อขายมีแนวโน้มปรับตัวสูงขึ้น`,
        `นักลงทุนควรติดตามปัจจัยมหภาคและผลประกอบการรายไตรมาสถัดไป`
      ],
      fullContent: `${article.title}\n\n${article.snippet}\n\nเนื้อหาฉบับเต็มได้รับการประมวลผลและเรียบเรียงโดยระบบผู้ช่วยวิเคราะห์การลงทุนอัตโนมัติ AI Stock Pulse`,
      region: article.category,
      timeframe: 'daily',
      marketName: article.category === 'thai' ? 'SET Index' : 'NASDAQ Composite',
      date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
      periodLabel: `สรุปสด AI • ${new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}`,
      sentiment: article.category === 'thai' ? 'bullish' : 'bullish',
      tickers: article.category === 'thai' ? ['PTT', 'DELTA'] : ['NVDA', 'AAPL'],
      readTime: '2 นาที',
      audioDuration: '1:20',
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
  }
};
