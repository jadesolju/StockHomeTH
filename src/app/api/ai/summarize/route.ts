import { NextRequest, NextResponse } from 'next/server';
import { summarizeArticleWithGeminiServer } from '../../../../lib/services/geminiServerService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKeyHeader = req.headers.get('x-api-key') || undefined;

    const payload = {
      title: body.title || 'ตลาดหุ้นปรับตัวขานรับปัจจัยเศรษฐกิจเชิงบวก',
      snippet: body.snippet || body.url || 'ความเชื่อมั่นของนักลงทุนฟื้นตัวต่อเนื่อง',
      source: body.source || 'StockHome Intelligence',
      category: (body.category === 'thai' ? 'thai' : 'global') as 'thai' | 'global',
    };

    const result = await summarizeArticleWithGeminiServer(payload, apiKeyHeader);
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'AI Summarization failed',
      },
      { status: 500 }
    );
  }
}
