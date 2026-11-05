import type { RunCoordinator } from 'node-cron';

import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import {
  claimCronRun,
  type CronRunStore,
  pruneCronRuns,
} from '@/lib/mutations/cron/claim-cron-run';

const logger = createLogger('cron:run-coordinator');

/**
 * Lets only the replica that claims a run execute it. A failing claim throws,
 * which node-cron treats as "do not run" (fail closed), so a run is never
 * executed without holding its claim.
 */
export function createRunCoordinator(
  store: CronRunStore = prisma
): RunCoordinator {
  return {
    async shouldRun(key) {
      let claimed: boolean;
      try {
        claimed = await claimCronRun(key, store);
      } catch (error) {
        logger.error({ key, error }, 'Failed to claim scheduled run');
        throw error;
      }

      if (claimed) {
        await pruneCronRuns(new Date(), store).catch((error: unknown) => {
          logger.warn({ error }, 'Failed to prune old cron runs');
        });
      }

      return claimed;
    },
  };
}
