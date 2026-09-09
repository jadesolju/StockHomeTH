import { NextRequest, NextResponse } from 'next/server';
import {
  getCachedAnalysis,
  setCachedAnalysis,
  getUserQuotaState,
  consumeUserCredit,
  analyzeStockWithGemini15Flash,
  type AnalysisResponse,
} from '../../../../lib/services/aiStockAnalysisService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const symbol = String(body.symbol || '').trim().toUpperCase();
    const market = (body.market === 'US' ? 'US' : 'SET') as 'SET' | 'US';
    const userTier = String(body.userTier || 'free').toLowerCase();
    const stockData = body.stockData || {};
    const apiKeyHeader = req.headers.get('x-api-key') || undefined;

    if (!symbol) {
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          cached: false,
          error: 'กรุณาระบุชื่อย่อหุ้น (Stock Symbol)',
          code: 'INVALID_INPUT',
          quota: {
            tier: userTier,
            creditsUsed: 0,
            creditsRemaining: 0,
            maxCredits: 0,
            resetDate: new Date().toISOString().split('T')[0],
          },
        },
        { status: 400 }
      );
    }

    // Determine user identifier (IP / session / userId)
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local-client';
    const userId = body.userId || clientIp;
    const todayStr = new Date().toISOString().split('T')[0];

    // ========================================================
    // 1. Smart Cache Check (Key: SYMBOL:YYYY-MM-DD)
    // If queried before on the same day: return immediately with 0 credit deduction!
    // ========================================================
    const cachedResult = getCachedAnalysis(symbol, todayStr);
    const quotaState = getUserQuotaState(userId, userTier);

    if (cachedResult) {
      const remaining = Math.max(0, quotaState.maxCredits - quotaState.credits_used);
      return NextResponse.json<AnalysisResponse>({
        success: true,
        cached: true,
        data: cachedResult,
        quota: {
          tier: userTier,
          creditsUsed: quotaState.credits_used,
          creditsRemaining: remaining,
          maxCredits: quotaState.maxCredits,
          resetDate: quotaState.todayStr,
        },
      });
    }

    // ========================================================
    // 2. Deduction & Rate Limiting Rule: credits_used < max_credits
    // ========================================================
    if (quotaState.credits_used >= quotaState.maxCredits) {
      return NextResponse.json<AnalysisResponse>(
        {
          success: false,
          cached: false,
          error: `โควตาเครดิต AI ประจำวันของแพ็กเกจ ${userTier.toUpperCase()} เต็มแล้ว (${quotaState.credits_used}/${quotaState.maxCredits} ครั้ง) กรุณาอัปเกรดแพ็กเกจเพื่อรับโควตาเพิ่ม`,
          code: 'RATE_LIMIT_EXCEEDED',
          quota: {
            tier: userTier,
            creditsUsed: quotaState.credits_used,
            creditsRemaining: 0,
            maxCredits: quotaState.maxCredits,
            resetDate: quotaState.todayStr,
          },
        },
        { status: 429 }
      );
    }

    // ========================================================
    // 3. Deduct credit & Execute
    // ========================================================
    const newUsage = consumeUserCredit(userId);
    const analysis = await analyzeStockWithGemini15Flash({
      symbol,
      market,
      stockData,
      userApiKey: apiKeyHeader,
    });

    // Save to Smart Cache (24h TTL)
    setCachedAnalysis(symbol, todayStr, analysis);

    const creditsRemaining = Math.max(0, quotaState.maxCredits - newUsage);

    return NextResponse.json<AnalysisResponse>({
      success: true,
      cached: false,
      data: analysis,
      quota: {
        tier: userTier,
        creditsUsed: newUsage,
        creditsRemaining,
        maxCredits: quotaState.maxCredits,
        resetDate: quotaState.todayStr,
      },
    });
  } catch (error) {
    console.error('[API /api/ai/analyze-stock] Error:', error);
    return NextResponse.json<AnalysisResponse>(
      {
        success: false,
        cached: false,
        error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการวิเคราะห์หุ้น',
        code: 'API_ERROR',
        quota: {
          tier: 'free',
          creditsUsed: 0,
          creditsRemaining: 0,
          maxCredits: 3,
          resetDate: new Date().toISOString().split('T')[0],
        },
      },
      { status: 500 }
    );
  }
}
