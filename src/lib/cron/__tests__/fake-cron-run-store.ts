import type { CronRunStore } from '@/lib/mutations/cron/claim-cron-run';

const MAX_LATENCY_MS = 5;

function randomLatency(): Promise<void> {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.random() * MAX_LATENCY_MS)
  );
}

/**
 * In-memory CronRun table with the database's uniqueness semantics: the key is
 * the primary key and the existence check plus insert is one atomic step.
 * Random latency before it makes concurrent callers interleave like replicas.
 */
export function createFakeCronRunStore() {
  const rows = new Map<string, Date>();

  const store: CronRunStore = {
    cronRun: {
      async createMany({ data, skipDuplicates }) {
        await randomLatency();
        let count = 0;
        for (const { key } of data) {
          if (rows.has(key)) {
            if (!skipDuplicates) throw new Error('Unique constraint failed');
            continue;
          }
          rows.set(key, new Date());
          count++;
        }
        return { count };
      },
      async deleteMany({ where }) {
        let count = 0;
        for (const [key, claimedAt] of rows) {
          if (claimedAt < where.claimedAt.lt) {
            rows.delete(key);
            count++;
          }
        }
        return { count };
      },
    },
  };

  return { rows, store };
}
