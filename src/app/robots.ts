import type { MetadataRoute } from 'next';

/** Sections only signed-in users reach, plus the API. Crawlers are kept out of them. */
const PRIVATE_PATHS = ['/api/', '/dashboard', '/admin'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: PRIVATE_PATHS },
  };
}
