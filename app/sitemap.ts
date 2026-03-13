import { MetadataRoute } from 'next';
import sql from '@/lib/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hvacrevenueboost.com';

  try {
    // Fetch all published pages from Neon
    const pages = await sql`
      SELECT slug, created_at 
      FROM pages 
      WHERE status = 'published'
      LIMIT 10000
    `;

    const staticRoutes = [
      '',
      '/repair',
      '/diagnose',
    ].map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    }));

    const dynamicRoutes = pages.map((page) => ({
      url: `${baseUrl}/${page.slug}`,
      lastModified: new Date(page.created_at || new Date()),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...dynamicRoutes];
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return [];
  }
}
