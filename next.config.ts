import type { NextConfig } from 'next';

import { STATIC_SECURITY_HEADERS } from '@/lib/security-headers';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty'],
  turbopack: {},
  experimental: {
    useTypeScriptCli: false,
  },
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
