/**
 * batchStockScreenerService.ts
 * Batch Processing Engine for Stock Confirmation & Intelligence Analysis.
 *
 * Bundles pre-filtered stock candidates into a single LLM request rather than
 * making 1-by-1 per-stock calls (e.g., 20 stock calls -> 1 bundled batch call).
 * Massively reduces OpenRouter API calls (90-95% reduction).
 */

export interface CandidateStockData {
  ticker: string;
  name: string;
  market: 'SET' | 'MAI' | 'US' | 'CRYPTO';
  price: number;
  changePercent: number;
  peRatio?: number;
  marketCap?: string;
  dividendYield?: number;
  signals: string[];
}

export interface BatchStockEvaluationResult {
  ticker: string;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'WATCH';
  score: number; // 0 - 100
  keyReasons: string[];
  riskFactor: string;
}

export interface BatchAnalysisResponse {
  evaluations: Record<string, BatchStockEvaluationResult>;
  marketSummary: string;
  processedCount: number;
  apiRequestsUsed: number; // 1
}

/**
 * Execute Batch Processing on candidate stock list in 1 single OpenRouter request.
 */
export async function batchAnalyzeStockCandidates(
  candidates: CandidateStockData[],
  apiKey?: string
): Promise<BatchAnalysisResponse> {
  if (candidates.length === 0) {
    return { evaluations: {}, marketSummary: 'ไม่พบหุ้นที่ผ่านเกณฑ์เบื้องต้น', processedCount: 0, apiRequestsUsed: 0 };
  }

  // Pre-filter code-first to limit candidates (max 15 per batch for optimal token size)
  const bundle = candidates.slice(0, 15);

  // If no API key provided, fall back to algorithmic zero-API scoring
  if (!apiKey) {
    const evaluations: Record<string, BatchStockEvaluationResult> = {};
    for (const stock of bundle) {
      const score = Math.min(95, Math.max(40, 50 + stock.changePercent * 3 + (stock.dividendYield || 0) * 2));
      evaluations[stock.ticker] = {
        ticker: stock.ticker,
        recommendation: score >= 75 ? 'BUY' : 'HOLD',
        score: Math.round(score),
        keyReasons: [`ราคาปัจจุบัน ${stock.price}`, ...stock.signals],
        riskFactor: 'ความผันผวนของราคาและสภาวะตลาด',
      };
    }
    return {
      evaluations,
      marketSummary: `ประมวลผลหุ้นแบบ Code-First สำหรับ ${bundle.length} ตัวสำเร็จ`,
      processedCount: bundle.length,
      apiRequestsUsed: 0,
    };
  }

  // Construct single multi-stock JSON batch payload prompt
  const stockBundlePrompt = bundle
    .map(
      (s, idx) =>
        `[Stock ${idx + 1}]: ${s.ticker} (${s.name}) | Price: ${s.price} (${s.changePercent >= 0 ? '+' : ''}${s.changePercent}%) | P/E: ${s.peRatio ?? 'N/A'} | Div: ${s.dividendYield ?? 0}% | Signals: ${s.signals.join(', ')}`
    )
    .join('\n');

  const systemPrompt = `คุณคือ "Batch Financial Evaluation Engine"
วิเคราะห์หุ้นทั้งหมดในรายชื่อที่ส่งให้อย่างรวดเร็วในคราวเดียว ตอบกลับเป็น JSON ในรูปแบบ:
{
  "evaluations": {
    "TICKER": {
      "ticker": "TICKER",
      "recommendation": "BUY" | "HOLD" | "WATCH",
      "score": 85,
      "keyReasons": ["เหตุผล 1", "เหตุผล 2"],
      "riskFactor": "ความเสี่ยงหลัก"
    }
  },
  "marketSummary": "สรุปภาพรวมหุ้นใน Batch นี้ 1-2 ประโยค"
}`;

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-OpenRouter-Title': 'StockHome Batch Screener',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-lite-preview-02-05:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `[รายชื่อหุ้นที่เข้าเงื่อนไขเบื้องต้น ${bundle.length} ตัว]:\n${stockBundlePrompt}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      throw new Error(`OpenRouter Batch HTTP status ${res.status}`);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');

    return {
      evaluations: parsed.evaluations || {},
      marketSummary: parsed.marketSummary || 'ประมวลผล Batch เรียบร้อยแล้ว',
      processedCount: bundle.length,
      apiRequestsUsed: 1, // Single bundled API request
    };
  } catch (err) {
    console.warn('[BatchStockScreener] Batch LLM fallback:', err);
    // Algorithmic fallback
    const evaluations: Record<string, BatchStockEvaluationResult> = {};
    for (const stock of bundle) {
      evaluations[stock.ticker] = {
        ticker: stock.ticker,
        recommendation: stock.changePercent >= 0 ? 'BUY' : 'HOLD',
        score: stock.changePercent >= 0 ? 75 : 55,
        keyReasons: [`ราคาปัจจุบัน ${stock.price}`, ...stock.signals],
        riskFactor: 'ปัจจัยความผันผวนมหภาค',
      };
    }
    return {
      evaluations,
      marketSummary: `ประมวลผล Code-First fallback สำหรับ ${bundle.length} ตัว`,
      processedCount: bundle.length,
      apiRequestsUsed: 0,
    };
  }
}
