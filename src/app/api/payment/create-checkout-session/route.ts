import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// In-memory rate limiter: lightweight anti-spam debounce (1s per IP)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_MS = 1_000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    return NextResponse.json(
      { error: 'ยังไม่ได้ตั้งค่า STRIPE_SECRET_KEY บน Vercel (กรุณาไปที่ Vercel Dashboard → Settings → Environment Variables แล้วใส่ sk_live_...)' },
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
      { error: `กรุณารอสักครู่ (${retryAfter} วินาที) ก่อนลองใหม่อีกครั้ง` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }
  rateLimitMap.set(ip, now);

  // --- Parse body ---
  let body: {
    priceId?: string;
    packageId?: string;
    quantity?: number;
    mode?: 'payment' | 'subscription';
    userId?: string;
    userEmail?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { priceId, packageId, quantity = 1, mode = 'payment', userId, userEmail } = body;
  if (!priceId) {
    return NextResponse.json({ error: 'priceId is required' }, { status: 400 });
  }

  const host = req.headers.get('host');
  const protocol = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
  const derivedBaseUrl = host ? `${protocol}://${host}` : null;
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    derivedBaseUrl ||
    'http://localhost:3000';

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
      payment_method_types: mode === 'payment' ? ['card', 'promptpay'] : ['card'],
      line_items: [{ price: resolvedPriceId, quantity }],
      mode,
      customer_email: userEmail || undefined,
      client_reference_id: userId || undefined,
      success_url: `${baseUrl}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/payments/cancel`,
      allow_promotion_codes: false, // GemCoin coupon only (not Stripe discount codes)
      metadata: {
        source: 'gemcoin_topup',
        ...(packageId ? { packageId } : {}),
        mode,
        ...(userId ? { userId } : {}),
        ...(userEmail ? { userEmail } : {}),
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('[Stripe] checkout.sessions.create error:', err);
    const errorMessage = err?.message
      ? `Stripe Error: ${err.message}`
      : 'Stripe session creation failed';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

