import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// In-memory rate limiter: 1 session create per IP per 30 seconds
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 30_000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'STRIPE_SECRET_KEY is not configured on this environment' },
      { status: 500 }
    );
  }

  // --- Rate limit check ---
  const ip = getClientIp(req);
  const now = Date.now();
  const lastRequest = rateLimitMap.get(ip) ?? 0;
  if (now - lastRequest < RATE_LIMIT_MS) {
    const retryAfter = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
    return NextResponse.json(
      { error: `กรุณารอ ${retryAfter} วินาที ก่อนลองใหม่อีกครั้ง` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }
  rateLimitMap.set(ip, now);

  // --- Parse body ---
  let body: { priceId?: string; quantity?: number; mode?: 'payment' | 'subscription' };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { priceId, quantity = 1, mode = 'payment' } = body;
  if (!priceId) {
    return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    // If a Product ID (prod_...) is provided instead of a Price ID (price_...),
    // fetch its default active Price ID dynamically from Stripe.
    let resolvedPriceId = priceId;
    if (priceId.startsWith('prod_')) {
      const prices = await stripe.prices.list({ product: priceId, active: true, limit: 1 });
      if (prices.data.length > 0) {
        resolvedPriceId = prices.data[0].id;
      } else {
        return NextResponse.json(
          { error: `ไม่พบ Price ID ที่ใช้งานได้สำหรับ Product ${priceId}` },
          { status: 400 }
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: resolvedPriceId, quantity }],
      mode,
      success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payments/cancel`,
      allow_promotion_codes: false, // GemCoin coupon only (not Stripe discount codes)
      metadata: { source: 'gemcoin_topup' },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('[Stripe] checkout.sessions.create error:', err);
    return NextResponse.json({ error: 'Stripe session creation failed' }, { status: 500 });
  }
}
