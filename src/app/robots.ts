import type { MetadataRoute } from 'next';

import { getRobots } from '@/lib/framework/seo';

export default function robots(): Promise<MetadataRoute.Robots> {
  return getRobots();
}
