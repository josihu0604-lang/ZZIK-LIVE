import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://zzik.live';
  const lastModified = new Date();

  // Static routes
  const routes = [
    '',
    '/feed',
    '/explore',
    '/offers',
    '/wallet',
    '/scan',
    '/pass',
    '/auth/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
}
