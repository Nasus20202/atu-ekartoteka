import type { NextConfig } from 'next';

import { STATIC_SECURITY_HEADERS } from '@/lib/security-headers';

const nextConfig: NextConfig = {
  output: 'standalone',
  deploymentId: process.env.DEPLOYMENT_ID || undefined,
  serverExternalPackages: ['pino', 'pino-pretty'],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {},
  logging: {
    incomingRequests: {
      ignore: [/\/api\/health/],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [...STATIC_SECURITY_HEADERS],
      },
    ];
  },
};

export default nextConfig;
