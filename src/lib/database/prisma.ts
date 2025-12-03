import { PrismaPg } from '@prisma/adapter-pg';
import { SqlDriverAdapterFactory } from '@prisma/client/runtime/client';
import { readReplicas } from '@prisma/extension-read-replicas';

import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const createNewAdapter = (connectionString: string) =>
  new PrismaPg({
    connectionString,
  });

const createNewClient = (adapter: SqlDriverAdapterFactory) =>
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['error', 'warn', 'info', 'query']
        : ['error', 'warn'],
  });

function createPrismaClient() {
  const writerClient = createNewClient(
    createNewAdapter(process.env.DATABASE_URL!)
  );

  const replicaClients = process.env.DATABASE_REPLICA_URLS
    ? process.env.DATABASE_REPLICA_URLS.split(',')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .map((url) => createNewClient(createNewAdapter(url)))
    : [];

  if (replicaClients.length > 0) {
    return writerClient.$extends(
      readReplicas({
        replicas: replicaClients,
      })
    );
  }

  return writerClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
