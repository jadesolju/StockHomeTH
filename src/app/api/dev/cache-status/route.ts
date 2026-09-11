import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const now = new Date();

  return NextResponse.json(
    {
      success: true,
      timestamp: now.toISOString(),
      serverEpoch: now.getTime(),
      message: 'Cloudflare Cache Status Diagnostic Engine',
      cachePolicy: {
        staticAssets: 'public, max-age=31536000, immutable (1 Year Edge Cache)',
        imagesAndFonts: 'public, max-age=2592000 (30 Days Edge Cache)',
        stockUniverse: 'public, s-maxage=300 (5 Minutes Edge Cache)',
        paymentAndStripe: 'no-store, no-cache, must-revalidate (Bypass Cache 100%)',
        aiChatAndPrompts: 'no-store, no-cache, must-revalidate (Bypass Cache 100%)',
        adminPortal: 'no-store, no-cache, must-revalidate (Bypass Cache 100%)',
      },
      cfHeadersDetected: {
        ray: req.headers.get('cf-ray') || 'Local / Not proxied',
        ipCountry: req.headers.get('cf-ipcountry') || 'TH',
        visitor: req.headers.get('cf-visitor') || 'direct',
        connectingIp: req.headers.get('cf-connecting-ip') || '127.0.0.1',
      },
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
        'CDN-Cache-Control': 'no-store',
        'Cloudflare-CDN-Cache-Control': 'no-store',
        'X-Cache-Engine': 'StockHomeTH-Origin-Guarded',
      },
    }
  );
}
