import * as cron from 'node-cron';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { createFakeCronRunStore } from '@/lib/cron/__tests__/fake-cron-run-store';

vi.mock('@/lib/database/prisma', () => ({ prisma: {} }));
vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const { CronScheduler } = await import('@/lib/cron/scheduler');
const { createRunCoordinator } = await import('@/lib/cron/run-coordinator');

// Real node-cron firing every second, so many scheduled runs happen quickly.
const EVERY_SECOND = '* * * * * *';
const REPLICAS = 5;
const OBSERVE_MS = 3500;
const MIN_RUNS = 2;
const SLOW_JOB_MS = 2500;
const OUTAGE_MS = 2200;
const TEST_TIMEOUT_MS = 15_000;

function startReplicas(
  store: Parameters<typeof createRunCoordinator>[0],
  jobs: Record<string, () => Promise<void>>
) {
  const schedulers = Array.from(
    { length: REPLICAS },
    () => new CronScheduler(createRunCoordinator(store))
  );
  for (const scheduler of schedulers) {
    for (const [name, job] of Object.entries(jobs)) {
      scheduler.scheduleTask(name, EVERY_SECOND, job);
    }
  }

  return () => schedulers.forEach((scheduler) => scheduler.stopAll());
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Scenarios run concurrently, each with its own replicas and job names.
describe.concurrent('CronScheduler across replicas (real node-cron)', () => {
  beforeAll(() => {
    cron.setLogger({ info() {}, warn() {}, error() {}, debug() {} });
  });

  it(
    'runs each scheduled run exactly once however many replicas fire it',
    async () => {
      const { store, rows } = createFakeCronRunStore();
      const job = vi.fn().mockResolvedValue(undefined);

      const stop = startReplicas(store, { once: job });
      await wait(OBSERVE_MS);
      stop();

      expect(job.mock.calls.length).toBeGreaterThanOrEqual(MIN_RUNS);
      expect(rows.size).toBe(job.mock.calls.length);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'runs each job once per scheduled time independently',
    async () => {
      const { store, rows } = createFakeCronRunStore();
      const jobA = vi.fn().mockResolvedValue(undefined);
      const jobB = vi.fn().mockResolvedValue(undefined);

      const stop = startReplicas(store, { 'job-a': jobA, 'job-b': jobB });
      await wait(OBSERVE_MS);
      stop();

      const keysFor = (name: string) =>
        [...rows.keys()].filter((key) => key.startsWith(`${name}:`)).length;

      expect(jobA.mock.calls.length).toBeGreaterThanOrEqual(MIN_RUNS);
      expect(keysFor('job-a')).toBe(jobA.mock.calls.length);
      expect(keysFor('job-b')).toBe(jobB.mock.calls.length);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'does not run again when a job outlasts the next scheduled time',
    async () => {
      const { store, rows } = createFakeCronRunStore();
      const slowJob = vi.fn(async () => {
        await wait(SLOW_JOB_MS);
      });

      const stop = startReplicas(store, { slow: slowJob });
      await wait(OBSERVE_MS);
      stop();

      expect(slowJob.mock.calls.length).toBeGreaterThanOrEqual(1);
      expect(rows.size).toBe(slowJob.mock.calls.length);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'does not retry a job that throws in the same scheduled time',
    async () => {
      const { store, rows } = createFakeCronRunStore();
      const failing = vi.fn().mockRejectedValue(new Error('job failed'));

      const stop = startReplicas(store, { failing });
      await wait(OBSERVE_MS);
      stop();

      expect(failing.mock.calls.length).toBeGreaterThanOrEqual(MIN_RUNS);
      expect(rows.size).toBe(failing.mock.calls.length);
    },
    TEST_TIMEOUT_MS
  );

  it(
    'runs nothing when claiming fails, and recovers when it works again',
    async () => {
      const { store } = createFakeCronRunStore();
      const realCreateMany = store.cronRun.createMany;
      let claimsFail = true;
      store.cronRun.createMany = async (args) => {
        if (claimsFail) throw new Error('db down');
        return realCreateMany(args);
      };
      const job = vi.fn().mockResolvedValue(undefined);

      const stop = startReplicas(store, { recovering: job });
      await wait(OUTAGE_MS);
      expect(job).not.toHaveBeenCalled();

      claimsFail = false;
      await wait(OUTAGE_MS);
      stop();

      expect(job.mock.calls.length).toBeGreaterThanOrEqual(1);
    },
    TEST_TIMEOUT_MS
  );
});
