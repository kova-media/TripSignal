import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : undefined;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/account/', '/admin/', '/api/', '/profile/', '/signin', '/reset'],
      },
    ],
    sitemap: siteUrl ? `${siteUrl.replace(/\/$/, '')}/sitemap.xml` : undefined,
    host: siteUrl,
  };
}
