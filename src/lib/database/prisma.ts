import { trace } from '@opentelemetry/api';
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

function withTracing<T extends { $extends: PrismaClient['$extends'] }>(
  client: T
) {
  const tracer = trace.getTracer('prisma');

  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({
          model,
          operation,
          args,
          query,
        }: {
          model: string;
          operation: string;
          args: unknown;
          query: (args: unknown) => Promise<unknown>;
        }) {
          const spanName = `prisma:${model}.${operation}`;
          return tracer.startActiveSpan(spanName, async (span) => {
            span.setAttribute('db.system', 'postgresql');
            span.setAttribute('db.operation', operation);
            span.setAttribute('db.prisma.model', model);
            try {
              const result = await query(args);
              return result;
            } catch (error) {
              span.recordException(error as Error);
              throw error;
            } finally {
              span.end();
            }
          });
        },
      },
    },
  });
}

function createPrismaClient() {
  const writerClient = createNewClient(
    createNewAdapter(process.env.DATABASE_URL!)
  );

  const replicaClients = process.env.DATABASE_REPLICA_URLS
    ? process.env.DATABASE_REPLICA_URLS.split(',')
        .map((url) => url.trim())
        .filter((url) => url.length > 0)
        .map((url) => withTracing(createNewClient(createNewAdapter(url))))
    : [];

  if (replicaClients.length > 0) {
    return withTracing(
      writerClient.$extends(
        readReplicas({
          replicas: replicaClients,
        })
      )
    );
  }

  return withTracing(writerClient);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
