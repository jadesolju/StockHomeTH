import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';
import { GEMCOIN_TOPUP_PACKAGES, GEMCOIN_SUBSCRIPTION_TIERS } from '@/config/gemCoinPackages';

export const dynamic = 'force-dynamic';

// In-memory cache of already credited session IDs to prevent duplicate fulfillment
const creditedSessions = new Set<string>();

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY is not configured on this server' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Retrieve the session with line items and customer details
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    const isPaid = session.payment_status === 'paid';

    if (!isPaid) {
      return NextResponse.json({
        success: false,
        paid: false,
        status: session.status,
        paymentStatus: session.payment_status,
        message: 'การชำระเงินยังไม่เสร็จสมบูรณ์',
      });
    }

    const packageId = session.metadata?.packageId || '';
    const mode = (session.metadata?.mode || session.mode) as 'payment' | 'subscription';
    const isAlreadyCredited = creditedSessions.has(sessionId);

    // Record session as credited
    creditedSessions.add(sessionId);

    if (mode === 'subscription') {
      const tierSpec = GEMCOIN_SUBSCRIPTION_TIERS.find((t) => t.tier === packageId);
      return NextResponse.json({
        success: true,
        paid: true,
        alreadyCredited: isAlreadyCredited,
        mode: 'subscription',
        tier: packageId || 'pro',
        tierName: tierSpec ? tierSpec.name : 'Subscription Tier',
        dailyGemCoins: tierSpec ? tierSpec.dailyGemCoins : 5000,
        amountPaid: (session.amount_total || 0) / 100,
        currency: session.currency?.toUpperCase() || 'THB',
        customerEmail: session.customer_details?.email || null,
        customerName: session.customer_details?.name || null,
        sessionId: session.id,
      });
    }

    // Top-up GemCoin package mode
    const matchedPackage = GEMCOIN_TOPUP_PACKAGES.find((p) => p.id === packageId);
    const gemCoins = matchedPackage
      ? matchedPackage.gemCoins + matchedPackage.bonusCoins
      : 1500;
    const packageName = matchedPackage ? matchedPackage.name : 'GemCoins Package';

    return NextResponse.json({
      success: true,
      paid: true,
      alreadyCredited: isAlreadyCredited,
      mode: 'payment',
      packageId,
      packageName,
      gemCoinsAdded: gemCoins,
      amountPaid: (session.amount_total || 0) / 100,
      currency: session.currency?.toUpperCase() || 'THB',
      customerEmail: session.customer_details?.email || null,
      customerName: session.customer_details?.name || null,
      sessionId: session.id,
    });
  } catch (err: any) {
    console.error('[Verify Session Error]:', err);
    return NextResponse.json(
      { error: err.message || 'ไม่สามารถตรวจสอบสถานะการชำระเงินได้' },
      { status: 500 }
    );
  }
}
