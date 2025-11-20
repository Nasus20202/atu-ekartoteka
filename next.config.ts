import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['pino', 'pino-pretty'],
  turbopack: {},
  logging: {
    incomingRequests: {
      ignore: [/\/api\/health/],
    },
  },
};

export default nextConfig;
