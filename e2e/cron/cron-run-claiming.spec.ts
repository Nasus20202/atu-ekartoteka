/**
 * Scheduled runs are claimed through the real database: however many replicas
 * (independent connection pools) reach the same run, exactly one executes it.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'crypto';

import { PrismaClient } from '@/generated/prisma/client';
import { createRunCoordinator } from '@/lib/cron/run-coordinator';
import { CronScheduler } from '@/lib/cron/scheduler';
import { claimCronRun } from '@/lib/mutations/cron/claim-cron-run';

import { expect, test } from '../fixtures';

const REPLICAS = 20;
const SCHEDULER_REPLICAS = 3;
const EVERY_SECOND = '* * * * * *';
const OBSERVE_MS = 3500;
const MIN_RUNS = 2;

function createReplicaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');

  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function runsWithKey(client: PrismaClient, key: string) {
  return client.cronRun.findMany({ where: { key } });
}

function runsWithPrefix(client: PrismaClient, prefix: string) {
  return client.cronRun.findMany({ where: { key: { startsWith: prefix } } });
}

test.describe('Cron run claiming', () => {
  const clients: PrismaClient[] = [];
  const prefix = `e2e-${randomUUID()}`;

  test.afterAll(async () => {
    const cleanup = createReplicaClient();
    clients.push(cleanup);
    await cleanup.cronRun.deleteMany({
      where: { key: { startsWith: prefix } },
    });
    await Promise.all(clients.map((client) => client.$disconnect()));
  });

  test('exactly one of many replicas claims a run', async () => {
    const key = `${prefix}:claim:${new Date().toISOString()}`;
    const replicas = Array.from({ length: REPLICAS }, createReplicaClient);
    clients.push(...replicas);

    const results = await Promise.all(
      replicas.map((client) => claimCronRun(key, client))
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await runsWithKey(replicas[0], key)).toHaveLength(1);
  });

  test('a later replica cannot claim a run that was already claimed', async () => {
    const key = `${prefix}:late:${new Date().toISOString()}`;
    const [first, late] = [createReplicaClient(), createReplicaClient()];
    clients.push(first, late);

    expect(await claimCronRun(key, first)).toBe(true);
    expect(await claimCronRun(key, late)).toBe(false);
  });

  test('replicas running every second execute each run once', async () => {
    const jobName = `${prefix}:job`;
    const replicas = Array.from({ length: SCHEDULER_REPLICAS }, () => {
      const client = createReplicaClient();
      clients.push(client);
      return {
        client,
        scheduler: new CronScheduler(createRunCoordinator(client)),
      };
    });
    let executions = 0;

    for (const { scheduler } of replicas) {
      scheduler.scheduleTask(jobName, EVERY_SECOND, async () => {
        executions++;
      });
    }
    await new Promise((resolve) => setTimeout(resolve, OBSERVE_MS));
    replicas.forEach(({ scheduler }) => scheduler.stopAll());

    const claimed = await runsWithPrefix(replicas[0].client, `${jobName}:`);
    expect(executions).toBeGreaterThanOrEqual(MIN_RUNS);
    expect(claimed).toHaveLength(executions);
  });
});
