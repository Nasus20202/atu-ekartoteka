import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type QueryExtension = {
  query: {
    $allModels: {
      $allOperations: (params: {
        model: string;
        operation: string;
        args: unknown;
        query: (args: unknown) => Promise<unknown>;
      }) => Promise<unknown>;
    };
  };
};

const mocks = vi.hoisted(() => {
  const span = {
    setAttribute: vi.fn(),
    recordException: vi.fn(),
    end: vi.fn(),
  };
  return {
    span,
    clients: [] as { options: unknown; extensions: unknown[] }[],
    adapters: [] as string[],
    readReplicas: vi.fn((options: unknown) => ({ readReplicas: options })),
    startActiveSpan: vi.fn(
      (_name: string, fn: (s: typeof span) => Promise<unknown>) => fn(span)
    ),
  };
});

vi.mock('@/generated/prisma/client', () => ({
  PrismaClient: class {
    options: unknown;
    extensions: unknown[] = [];
    constructor(options: unknown) {
      this.options = options;
      mocks.clients.push(this);
    }
    $extends(extension: unknown) {
      this.extensions.push(extension);
      return this;
    }
  },
}));
vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {
    constructor({ connectionString }: { connectionString: string }) {
      mocks.adapters.push(connectionString);
    }
  },
}));
vi.mock('@prisma/extension-read-replicas', () => ({
  readReplicas: mocks.readReplicas,
}));
vi.mock('@opentelemetry/api', () => ({
  trace: { getTracer: () => ({ startActiveSpan: mocks.startActiveSpan }) },
}));

const globalForPrisma = globalThis as { prisma?: unknown };

async function loadPrisma() {
  vi.resetModules();
  return (await import('@/lib/database/prisma')).prisma;
}

function tracingExtension(clientIndex = 0) {
  return mocks.clients[clientIndex].extensions.at(-1) as QueryExtension;
}

describe('prisma client', () => {
  beforeEach(() => {
    mocks.clients.length = 0;
    mocks.adapters.length = 0;
    vi.clearAllMocks();
    delete globalForPrisma.prisma;
    vi.stubEnv('DATABASE_URL', 'postgres://writer');
    vi.stubEnv('DATABASE_REPLICA_URLS', '');
    vi.stubEnv('NODE_ENV', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete globalForPrisma.prisma;
  });

  it('creates a traced writer client and caches it outside production', async () => {
    const prisma = await loadPrisma();

    expect(mocks.adapters).toEqual(['postgres://writer']);
    expect(mocks.clients).toHaveLength(1);
    expect(mocks.clients[0].options).toMatchObject({ log: ['error', 'warn'] });
    expect(globalForPrisma.prisma).toBe(prisma);
  });

  it('reuses the cached client', async () => {
    const cached = { cached: true };
    globalForPrisma.prisma = cached;

    await expect(loadPrisma()).resolves.toBe(cached);
    expect(mocks.clients).toHaveLength(0);
  });

  it('does not cache the client in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    await loadPrisma();

    expect(globalForPrisma.prisma).toBeUndefined();
  });

  it('logs queries in development', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    await loadPrisma();

    expect(mocks.clients[0].options).toMatchObject({
      log: ['error', 'warn', 'info', 'query'],
    });
  });

  it('adds traced read replicas from the comma-separated list', async () => {
    vi.stubEnv('DATABASE_REPLICA_URLS', ' postgres://r1 , ,postgres://r2');

    await loadPrisma();

    expect(mocks.adapters).toEqual([
      'postgres://writer',
      'postgres://r1',
      'postgres://r2',
    ]);
    expect(mocks.readReplicas).toHaveBeenCalledWith({
      replicas: [mocks.clients[1], mocks.clients[2]],
    });
  });

  it('wraps every query in a span with database attributes', async () => {
    await loadPrisma();
    const query = vi.fn().mockResolvedValue('rows');

    const result = await tracingExtension().query.$allModels.$allOperations({
      model: 'User',
      operation: 'findMany',
      args: { take: 1 },
      query,
    });

    expect(result).toBe('rows');
    expect(query).toHaveBeenCalledWith({ take: 1 });
    expect(mocks.startActiveSpan).toHaveBeenCalledWith(
      'prisma:User.findMany',
      expect.any(Function)
    );
    expect(mocks.span.setAttribute).toHaveBeenCalledWith(
      'db.system',
      'postgresql'
    );
    expect(mocks.span.end).toHaveBeenCalledOnce();
  });

  it('records query errors on the span and rethrows them', async () => {
    await loadPrisma();
    const error = new Error('query failed');

    await expect(
      tracingExtension().query.$allModels.$allOperations({
        model: 'User',
        operation: 'create',
        args: {},
        query: vi.fn().mockRejectedValue(error),
      })
    ).rejects.toBe(error);
    expect(mocks.span.recordException).toHaveBeenCalledWith(error);
    expect(mocks.span.end).toHaveBeenCalledOnce();
  });
});
