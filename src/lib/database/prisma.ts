import { PrismaPg } from '@prisma/adapter-pg';
import { readReplicas } from '@prisma/extension-read-replicas';

import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn', 'info', 'query']
        : ['error', 'warn'],
  });

  // Configure read replicas if replica URLs are provided
  const replicaUrls = process.env.DATABASE_REPLICA_URLS
    ? process.env.DATABASE_REPLICA_URLS.split(',').map((url) => url.trim())
    : [];

  if (replicaUrls.length > 0) {
    return client.$extends(
      readReplicas({
        url: replicaUrls,
      })
    );
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
