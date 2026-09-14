import { MetadataRoute } from 'next';

const BASE_URL = 'https://stockhometh.online';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date().toISOString();

  // Core static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/stocks`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stocks/thai`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/stocks/us`,
      lastModified: currentDate,
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ai-helper`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/payments`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // Popular Thai & US stocks for SEO indexing
  const popularTickers = [
    'DELTA', 'PTT', 'AOT', 'CPALL', 'ADVANC', 'KBANK', 'SCB', 'BDMS', 'GULF', 'PTTEP',
    'AAPL', 'NVDA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'TSLA', 'AMD', 'NFLX', 'INTC'
  ];

  const stockRoutes: MetadataRoute.Sitemap = popularTickers.map((ticker) => ({
    url: `${BASE_URL}/stocks?symbol=${ticker}`,
    lastModified: currentDate,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...stockRoutes];
}
