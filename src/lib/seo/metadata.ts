import { Metadata } from 'next';

export const SITE_CONFIG = {
  name: 'StockHomeTH',
  domain: 'stockhometh.online',
  baseUrl: 'https://stockhometh.online',
  description:
    'แพลตฟอร์มวิเคราะห์ข่าวหุ้น สรุปการเงินประจำวันด้วย AI และข้อมูลตลาดหุ้นไทย (SET) & สหรัฐฯ (US) แบบ Real-time',
  keywords: [
    'หุ้นไทย',
    'SET Index',
    'หุ้นสหรัฐ',
    'AI สรุปข่าวหุ้น',
    'Stock Analysis',
    'Gemini AI',
    'Claude AI',
    'วิเคราะห์หุ้น',
    'ข่าวหุ้นวันนี้',
    'การเงินการลงทุน',
  ],
  defaultOgImage: 'https://stockhometh.online/favicon.svg',
};

export function buildMetadata({
  title,
  description,
  path = '',
  keywords = [],
  ogImage,
}: {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  ogImage?: string;
} = {}): Metadata {
  const fullTitle = title
    ? `${title} | ${SITE_CONFIG.name}`
    : `${SITE_CONFIG.name} • สรุปข่าวหุ้น AI และข้อมูลตลาดหุ้นไทย & สหรัฐฯ`;

  const metaDescription = description || SITE_CONFIG.description;
  const canonicalUrl = `${SITE_CONFIG.baseUrl}${path}`;

  return {
    title: fullTitle,
    description: metaDescription,
    keywords: Array.from(new Set([...SITE_CONFIG.keywords, ...keywords])),
    metadataBase: new URL(SITE_CONFIG.baseUrl),
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description: metaDescription,
      url: canonicalUrl,
      siteName: SITE_CONFIG.name,
      locale: 'th_TH',
      type: 'website',
      images: [
        {
          url: ogImage || SITE_CONFIG.defaultOgImage,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: metaDescription,
      images: [ogImage || SITE_CONFIG.defaultOgImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}
