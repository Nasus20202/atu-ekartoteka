import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeCronRunStore } from '@/lib/cron/__tests__/fake-cron-run-store';
import { CRON_RUN_RETENTION_MS } from '@/lib/cron/constants';

const { mockLogger } = vi.hoisted(() => ({
  mockLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/database/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/logger', () => ({ createLogger: () => mockLogger }));

const { createRunCoordinator } = await import('@/lib/cron/run-coordinator');

const KEY = 'job:2026-11-05T10:00:00.000Z';
const TTL_MS = 30_000;

describe('createRunCoordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows the replica that claims the run', async () => {
    const { store } = createFakeCronRunStore();

    await expect(
      createRunCoordinator(store).shouldRun(KEY, TTL_MS)
    ).resolves.toBe(true);
  });

  it('denies every other replica', async () => {
    const { store } = createFakeCronRunStore();
    const replicas = Array.from({ length: 5 }, () =>
      createRunCoordinator(store)
    );

    const results = await Promise.all(
      replicas.map((replica) => replica.shouldRun(KEY, TTL_MS))
    );

    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('prunes old claims after winning', async () => {
    const { store, rows } = createFakeCronRunStore();
    rows.set('old', new Date(Date.now() - CRON_RUN_RETENTION_MS - 1000));

    await createRunCoordinator(store).shouldRun(KEY, TTL_MS);

    expect([...rows.keys()]).toEqual([KEY]);
  });

  it('does not prune when the claim is lost', async () => {
    const { store, rows } = createFakeCronRunStore();
    await createRunCoordinator(store).shouldRun(KEY, TTL_MS);
    rows.set('old', new Date(Date.now() - CRON_RUN_RETENTION_MS - 1000));

    await expect(
      createRunCoordinator(store).shouldRun(KEY, TTL_MS)
    ).resolves.toBe(false);

    expect(rows.has('old')).toBe(true);
  });

  it('still lets the winner run when pruning fails', async () => {
    const { store } = createFakeCronRunStore();
    store.cronRun.deleteMany = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(
      createRunCoordinator(store).shouldRun(KEY, TTL_MS)
    ).resolves.toBe(true);
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('logs and rethrows a failed claim so the run is not executed', async () => {
    const { store } = createFakeCronRunStore();
    store.cronRun.createMany = vi.fn().mockRejectedValue(new Error('db down'));

    await expect(
      createRunCoordinator(store).shouldRun(KEY, TTL_MS)
    ).rejects.toThrow('db down');
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.objectContaining({ key: KEY }),
      'Failed to claim scheduled run'
    );
  });
});
