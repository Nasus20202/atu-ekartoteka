import { describe, expect, it, vi } from 'vitest';

import { createFakeCronRunStore } from '@/lib/cron/__tests__/fake-cron-run-store';
import { CRON_RUN_RETENTION_MS } from '@/lib/cron/constants';

vi.mock('@/lib/database/prisma', () => ({ prisma: {} }));

const { claimCronRun, pruneCronRuns } =
  await import('@/lib/mutations/cron/claim-cron-run');

const KEY = 'cleanup-verifications:2026-11-05T10:00:00.000Z';
const REPLICAS = 50;

describe('claimCronRun', () => {
  it('claims a run the first time', async () => {
    const { store } = createFakeCronRunStore();

    await expect(claimCronRun(KEY, store)).resolves.toBe(true);
  });

  it('refuses a run that was already claimed, however much later', async () => {
    const { store } = createFakeCronRunStore();
    await claimCronRun(KEY, store);

    await expect(claimCronRun(KEY, store)).resolves.toBe(false);
    await expect(claimCronRun(KEY, store)).resolves.toBe(false);
  });

  it('lets exactly one of many concurrent replicas claim a run', async () => {
    const { store, rows } = createFakeCronRunStore();

    const results = await Promise.all(
      Array.from({ length: REPLICAS }, () => claimCronRun(KEY, store))
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(rows.size).toBe(1);
  });

  it('claims different jobs for the same time independently', async () => {
    const { store } = createFakeCronRunStore();

    await expect(
      claimCronRun('job-a:2026-11-05T10:00:00.000Z', store)
    ).resolves.toBe(true);
    await expect(
      claimCronRun('job-b:2026-11-05T10:00:00.000Z', store)
    ).resolves.toBe(true);
  });

  it('claims the next scheduled time as a new run', async () => {
    const { store } = createFakeCronRunStore();
    await claimCronRun('job:2026-11-05T10:00:00.000Z', store);

    await expect(
      claimCronRun('job:2026-11-05T11:00:00.000Z', store)
    ).resolves.toBe(true);
  });

  it('propagates a store failure instead of reporting a claim', async () => {
    const store = {
      cronRun: {
        createMany: vi.fn().mockRejectedValue(new Error('db down')),
        deleteMany: vi.fn(),
      },
    };

    await expect(claimCronRun(KEY, store)).rejects.toThrow('db down');
  });

  it('uses skipDuplicates so a lost claim is a count of zero, not an error', async () => {
    const createMany = vi.fn().mockResolvedValue({ count: 0 });

    await claimCronRun(KEY, {
      cronRun: { createMany, deleteMany: vi.fn() },
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [{ key: KEY }],
      skipDuplicates: true,
    });
  });
});

describe('pruneCronRuns', () => {
  it('deletes only runs older than the retention period', async () => {
    const { store, rows } = createFakeCronRunStore();
    const now = new Date('2026-11-20T00:00:00.000Z');
    rows.set('old', new Date(now.getTime() - CRON_RUN_RETENTION_MS - 1));
    rows.set('recent', new Date(now.getTime() - CRON_RUN_RETENTION_MS + 1));
    rows.set('fresh', now);

    await pruneCronRuns(now, store);

    expect([...rows.keys()].sort()).toEqual(['fresh', 'recent']);
  });
});
