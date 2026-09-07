import { NextResponse } from 'next/server';
import { getDeepLUsageStatus, translateWithDeepL } from '@/lib/services/deeplTranslationService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = getDeepLUsageStatus();
    return NextResponse.json({
      success: true,
      endpoint: 'https://api-free.deepl.com/v2/translate',
      status,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve DeepL status' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { text, targetLang = 'TH' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid text is required' },
        { status: 400 }
      );
    }

    const target = targetLang.toUpperCase() === 'EN' ? 'EN' : 'TH';
    const translated = await translateWithDeepL(text, target);
    const status = getDeepLUsageStatus();

    return NextResponse.json({
      success: true,
      original: text,
      targetLang: target,
      translated,
      status
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Translation request failed' },
      { status: 500 }
    );
  }
}
