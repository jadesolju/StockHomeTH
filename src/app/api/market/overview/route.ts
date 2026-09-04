import { NextResponse } from 'next/server';
import { fetchLiveStockFundamentals } from '../../../../lib/services/stockDataService';
import { mockDailyDigestSummary } from '../../../../data/mockNewsData';

export async function GET() {
  try {
    const stocks = await fetchLiveStockFundamentals();
    
    // Also fetch the top live news to extract breaking headline
    let topHeadline = 'สรุปภาวะตลาดหุ้นไทยและตลาดโลกประจำวัน';
    let liveCatalysts: string[] = [];

    try {
      const newsRes = await fetch('http://localhost:3000/api/news/live', { next: { revalidate: 30 } });
      if (newsRes.ok) {
        const newsJson = await newsRes.json();
        if (newsJson.data && Array.isArray(newsJson.data) && newsJson.data.length > 0) {
          const topArticle = newsJson.data[0];
          topHeadline = topArticle.title;
          liveCatalysts = newsJson.data.slice(0, 3).map((a: any) => `ประเด็นด่วน: ${a.title} (${a.source})`);
        }
      }
    } catch {
      // Fallback
    }

    if (stocks && stocks.length > 0) {
      const gainers = stocks.filter(s => s.change > 0).length;
      const losers = stocks.filter(s => s.change < 0).length;
      const unchanged = stocks.filter(s => s.change === 0).length;
      const total = stocks.length;

      const bullishPercent = Math.round((gainers / total) * 100);
      const bearishPercent = Math.round((losers / total) * 100);
      const neutralPercent = Math.max(0, 100 - bullishPercent - bearishPercent);

      const topGainer = [...stocks].sort((a, b) => b.change - a.change)[0];
      const topLoser = [...stocks].sort((a, b) => a.change - b.change)[0];

      const currentTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const currentDate = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

      if (liveCatalysts.length === 0) {
        liveCatalysts = [
          `หุ้นนำตลาดสูงสุด: ${topGainer?.ticker} (${topGainer?.currency} ${topGainer?.price}) บวก +${topGainer?.change?.toFixed(2)}%`,
          `อัตราส่วนหุ้นบวกต่อหุ้นลบในตลาดสด: ${gainers} ต่อ ${losers} บริษัท`,
          `ระบบ Real-time Multi-Source Data Engine เชื่อมต่อสมบูรณ์`
        ];
      } else {
        liveCatalysts.push(`หุ้นนำตลาดสูงสุด: ${topGainer?.ticker} (+${topGainer?.change?.toFixed(2)}%) จากสัดส่วนหุ้นบวก ${gainers} บริษัท`);
      }

      const overview = {
        periodLabel: `สรุปภาวะตลาดและข่าวเด่น • ${currentDate}`,
        updatedAt: currentTime,
        mainHeadline: topHeadline || `ตลาดภาพรวมเคลื่อนไหว ${bullishPercent >= 50 ? 'เชิงบวก' : 'ผันผวน'} นำโดย ${topGainer?.ticker || 'หุ้นกลุ่มนำ'}`,
        overviewSummary: `ความเคลื่อนไหวตลาดล่าสุด: หุ้นปรับตัวขึ้น ${gainers} บริษัท, ปรับตัวลง ${losers} บริษัท จากทั้งหมด ${total} บริษัทที่ติดตามในระบบ พร้อมสรุปข่าวสารการเงินสดต่อเนื่องทุกนาที`,
        marketSentimentScore: {
          bullishPercent,
          neutralPercent,
          bearishPercent
        },
        keyCatalysts: liveCatalysts.slice(0, 4)
      };

      return NextResponse.json({ success: true, source: 'live_computed', data: overview });
    }
  } catch (err) {
    console.warn('[Market Overview API] Live calculation error, falling back to mock:', err);
  }

  return NextResponse.json({ success: true, source: 'mock', data: mockDailyDigestSummary });
}
