import { NextResponse } from 'next/server';
import { fetchLiveStockFundamentals } from '../../../../lib/services/stockDataService';

export async function GET() {
  try {
    const data = await fetchLiveStockFundamentals();
    return NextResponse.json({
      success: true,
      count: data.length,
      timestamp: new Date().toISOString(),
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch live stocks',
      },
      { status: 500 }
    );
  }
}
