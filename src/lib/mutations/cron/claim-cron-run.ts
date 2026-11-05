import { CRON_RUN_RETENTION_MS } from '@/lib/cron/constants';
import { prisma } from '@/lib/database/prisma';

export interface CronRunStore {
  cronRun: {
    createMany(args: {
      data: { key: string }[];
      skipDuplicates: boolean;
    }): Promise<{ count: number }>;
    deleteMany(args: {
      where: { claimedAt: { lt: Date } };
    }): Promise<{ count: number }>;
  };
}

/**
 * Claims a scheduled run. The key is the primary key, so exactly one insert of
 * it creates the row (INSERT .. ON CONFLICT DO NOTHING); every other caller,
 * concurrent or later, gets false.
 */
export async function claimCronRun(
  key: string,
  store: CronRunStore = prisma
): Promise<boolean> {
  const { count } = await store.cronRun.createMany({
    data: [{ key }],
    skipDuplicates: true,
  });

  return count === 1;
}

export function pruneCronRuns(now: Date, store: CronRunStore = prisma) {
  return store.cronRun.deleteMany({
    where: {
      claimedAt: { lt: new Date(now.getTime() - CRON_RUN_RETENTION_MS) },
    },
  });
}
