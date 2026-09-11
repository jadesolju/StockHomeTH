/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = {
        type: 'memory',
      };
    }
    return config;
  },
  async headers() {
    return [
      // 1. Next.js Static Bundles & CSS (Immutable, aggressive edge cache 1 year)
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=31536000',
          },
        ],
      },
      // 2. Static Media Assets (SVGs, PNGs, Favicons, WebP, Fonts - Cache 30 days)
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|ico|woff|woff2|ttf)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=86400',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=2592000',
          },
        ],
      },
      // 3. Financial, Payments, Stripe & QR PromptPay (STRICT NO-CACHE)
      {
        source: '/api/payment/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // 4. AI Chat, Prompt Tokens & Streaming (STRICT NO-CACHE)
      {
        source: '/api/ai/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // 5. Admin Backoffice & Dev Engine APIs (STRICT NO-CACHE)
      {
        source: '/api/dev/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'no-store',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // 6. Admin Portal UI Pages & Secure Portal (STRICT NO-CACHE)
      {
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      {
        source: '/hq-master-88/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // 7. Payments Page UI (STRICT NO-CACHE)
      {
        source: '/payments',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'no-store',
          },
        ],
      },
      // 8. Stock Universe Daily Cache (Edge Cache 5 minutes, S-Maxage for CDN)
      {
        source: '/api/stocks/universe',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
          },
          {
            key: 'Cloudflare-CDN-Cache-Control',
            value: 'max-age=300',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
