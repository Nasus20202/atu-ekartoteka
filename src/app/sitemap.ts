import type { MetadataRoute } from 'next';

import { getSitemap } from '@/lib/framework/seo';

export default function sitemap(): Promise<MetadataRoute.Sitemap> {
  return getSitemap();
}
