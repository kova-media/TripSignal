import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : null;

export default function sitemap(): MetadataRoute.Sitemap {
  if (!siteUrl) return [];

  const base = siteUrl.replace(/\/$/, '');

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}/alerts`,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${base}/terms`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/privacy`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/refunds`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/contact`,
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${base}/faq`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];
}
