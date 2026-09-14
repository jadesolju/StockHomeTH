import { NextResponse } from 'next/server';
import {
  fetchPendingAnalysisBatch,
  updateStockAnalysisResult,
  StockPoolItem,
} from '@/lib/services/stockPoolService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Helper to compute technical indicators and momentum from sparkline / price history (-1 baseline)
 */
function evaluateStockAnalytics(stock: StockPoolItem) {
  const price = stock.price || 0;
  const pe = stock.peRatio || 18.0;
  const yieldPct = stock.dividendYield || 0;
  const high52 = stock.high52w || price * 1.2;
  const low52 = stock.low52w || price * 0.8;
  const sparkline = stock.sparkline7d || [];

  // 1. Momentum & -1 Baseline check
  let prevPrice = price;
  if (sparkline.length >= 2) {
    prevPrice = sparkline[sparkline.length - 2]; // -1 previous data point
  } else if (stock.change) {
    prevPrice = price / (1 + stock.change / 100);
  }
  const changeFromPrev = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0;

  // 2. 52-Week Range Position
  const rangeSpan = high52 - low52;
  const positionInRange = rangeSpan > 0 ? ((price - low52) / rangeSpan) * 100 : 50;

  // 3. Technical Trend
  let trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS' = 'SIDEWAYS';
  if (changeFromPrev > 0.5 && positionInRange > 60) {
    trend = 'BULLISH';
  } else if (changeFromPrev < -0.5 && positionInRange < 40) {
    trend = 'BEARISH';
  }

  // 4. Valuation Verdict & Rating
  let rating: 'Buy' | 'Hold' | 'Sell' = 'Hold';
  let valuationVerdict = 'Fairly Valued (ราคาสะท้อนมูลค่าพื้นฐานเหมาะสม)';
  let targetPrice = Math.round(price * 1.15 * 100) / 100;

  if (pe < 15 && yieldPct >= 3.0) {
    rating = 'Buy';
    valuationVerdict = 'Undervalued (มูลค่าต่ำกว่าพื้นฐาน พร้อมปันผลจูงใจ)';
    targetPrice = Math.round(price * 1.22 * 100) / 100;
  } else if (pe > 45) {
    rating = positionInRange > 80 ? 'Hold' : 'Buy';
    valuationVerdict = 'Growth Premium (ราคาซื้อขายบนความคาดหวังการเติบโตสูง)';
    targetPrice = Math.round(price * 1.10 * 100) / 100;
  } else if (trend === 'BULLISH' && positionInRange > 50) {
    rating = 'Buy';
    valuationVerdict = 'Momentum Growth (มีแรงหนุนเชิงบวกตามรอบธุรกิจ)';
    targetPrice = Math.round(price * 1.18 * 100) / 100;
  }

  // 5. Strengths & Risks Generation
  const strengths = [
    `ฐานะทางการเงินและมาร์เก็ตแคปขนาดใหญ่ (${stock.marketCap || '—'}) เสริมเสถียรภาพ`,
    `ผลตอบแทนเงินปันผลระดับ ${yieldPct > 0 ? yieldPct + '%' : 'สม่ำเสมอตามรอบผลประกอบการ'}`,
    `สัญญาณเทคนิคภาพรวมอยู่ในโซน ${trend === 'BULLISH' ? 'ขาขึ้น (Bullish Momentum)' : trend === 'BEARISH' ? 'พักตัว (Consolidation)' : 'แกว่งตัวในกรอบ (Sideways)'}`,
  ];

  const risks = [
    `ความผันผวนของตลาดสากลและอัตราแลกเปลี่ยน (${stock.currency})`,
    `ระดับ P/E ${pe > 0 ? pe + 'x' : '—'} ต้องติดตามผลกำไรไตรมาสถัดไปเพื่อรักษา Valuation`,
    `แนวต้านสำคัญบริเวณ 52-Week High (${stock.currency === 'USD' ? '$' : '฿'}${high52.toLocaleString()})`,
  ];

  const summary = `หุ้น ${stock.ticker} (${stock.name}) ซื้อขายที่ระดับ ${stock.currency === 'USD' ? '$' : '฿'}${price.toLocaleString()} (${stock.change >= 0 ? '+' : ''}${stock.change}%) สถานะการประเมินมูลค่า: ${valuationVerdict} โดยมีสัญญาณภาพรวมเป็น ${trend}`;

  return {
    aiInsight: summary,
    analystRating: rating,
    targetPrice,
    sentimentScore: trend === 'BULLISH' ? 75 : trend === 'BEARISH' ? 40 : 55,
    analysisPayload: {
      summary,
      strengths,
      risks,
      valuationVerdict,
      technicalTrend: trend,
      catalysts: [
        'ผลประกอบการและยอดขายรอบล่าสุด',
        'การขยายตัวของกลุ่มอุตสาหกรรม ' + stock.sector,
        'กระแสเงินทุนและสภาพคล่องตลาด',
      ],
      priceTarget: targetPrice,
    },
    technicalIndicators: {
      trend,
      changeFromPrevious: Number(changeFromPrev.toFixed(2)),
      support: Math.round(low52 * 1.05 * 100) / 100,
      resistance: Math.round(high52 * 0.98 * 100) / 100,
    },
  };
}

/**
 * Cron Job 2: Processes pending stocks from Supabase Pool and updates status to 'completed'
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') || '10', 10);
    const limit = Math.min(Math.max(limitParam, 1), 25);

    const startTime = Date.now();
    console.log(`[Cron process-stock-analysis] Fetching up to ${limit} pending stocks...`);

    // 1. Fetch pending stocks from pool
    const pendingStocks = await fetchPendingAnalysisBatch(limit);
    if (pendingStocks.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending stocks to analyze at this time',
        processedCount: 0,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Process analysis concurrently
    const processedResults = await Promise.all(
      pendingStocks.map(async (stock) => {
        try {
          const analytics = evaluateStockAnalytics(stock);
          const ok = await updateStockAnalysisResult(stock.ticker, analytics);
          return {
            ticker: stock.ticker,
            success: ok,
            rating: analytics.analystRating,
            targetPrice: analytics.targetPrice,
          };
        } catch (err: any) {
          console.warn(`[Cron process-stock-analysis] Error analyzing ${stock.ticker}:`, err);
          return { ticker: stock.ticker, success: false, error: err.message };
        }
      })
    );

    const successCount = processedResults.filter((r) => r.success).length;
    const elapsedMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount}/${pendingStocks.length} pending stocks to completed status`,
      processedCount: successCount,
      details: processedResults,
      elapsedMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('[Cron process-stock-analysis] Exception:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error during analysis',
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
