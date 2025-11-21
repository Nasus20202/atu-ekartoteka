import * as cron from 'node-cron';

import { createLogger } from '@/lib/logger';

const logger = createLogger('cron:scheduler');

/**
 * Internal cron scheduler
 * Runs scheduled tasks within the application process
 */
export class CronScheduler {
  private tasks: Map<string, cron.ScheduledTask> = new Map();

  /**
   * Schedule a task
   * @param name - Unique task name
   * @param schedule - Cron schedule expression (e.g., '0 2 * * *' for daily at 2 AM)
   * @param task - Function to execute
   */
  scheduleTask(
    name: string,
    schedule: string,
    task: () => Promise<void>
  ): void {
    // Stop existing task if it exists
    if (this.tasks.has(name)) {
      this.tasks.get(name)?.stop();
      logger.info({ name }, 'Stopped existing task');
    }

    // Validate cron expression
    if (!cron.validate(schedule)) {
      logger.error({ name, schedule }, 'Invalid cron schedule');
      throw new Error(`Invalid cron schedule: ${schedule}`);
    }

    // Create and start the task
    const scheduledTask = cron.schedule(schedule, async () => {
      logger.info({ name }, 'Starting scheduled task');
      const startTime = Date.now();

      try {
        await task();
        const duration = Date.now() - startTime;
        logger.info(
          { name, duration },
          'Scheduled task completed successfully'
        );
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error({ name, error, duration }, 'Scheduled task failed');
      }
    });

    this.tasks.set(name, scheduledTask);
    logger.info({ name, schedule }, 'Scheduled task registered');
  }

  /**
   * Stop a scheduled task
   */
  stopTask(name: string): void {
    const task = this.tasks.get(name);
    if (task) {
      task.stop();
      this.tasks.delete(name);
      logger.info({ name }, 'Task stopped and removed');
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll(): void {
    this.tasks.forEach((task, name) => {
      task.stop();
      logger.info({ name }, 'Task stopped');
    });
    this.tasks.clear();
    logger.info('All tasks stopped');
  }

  /**
   * Get list of scheduled tasks
   */
  getTasks(): string[] {
    return Array.from(this.tasks.keys());
  }
}

// Singleton instance
let schedulerInstance: CronScheduler | null = null;

/**
 * Get the cron scheduler instance
 */
export function getCronScheduler(): CronScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new CronScheduler();
  }
  return schedulerInstance;
}
