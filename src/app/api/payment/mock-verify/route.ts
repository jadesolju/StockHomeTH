import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const planId = body.planId || 'lite';
    const amount = Number(body.amount) || (planId === 'lite' ? 19.0 : planId === 'pro' ? 129.0 : 299.0);
    const slipUploaded = Boolean(body.slipUploaded);

    // Simulated payment verification
    const mockTxnId = `MOCK_PAY_${Date.now()}_${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      status: 'PAID',
      amount: amount.toFixed(2),
      currency: 'THB',
      transactionId: mockTxnId,
      planId,
      paidAt: new Date().toISOString(),
      slipVerified: slipUploaded,
      message: `การจำลองชำระเงินสำเร็จ ระบบได้อัปเกรดแพ็กเกจเป็น ${planId.toUpperCase()} เรียบร้อยแล้ว`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Payment verification failed',
      },
      { status: 500 }
    );
  }
}
