import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://stockhometh.online';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/hq-master-88/', '/developer/', '/api/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Claude-Web',
          'Google-Extended',
          'Bytespider',
          'CCBot',
          'FacebookExternalHit',
        ],
        allow: ['/', '/stocks', '/stocks/thai', '/stocks/us', '/llms.txt'],
        disallow: ['/admin/', '/hq-master-88/', '/developer/', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
