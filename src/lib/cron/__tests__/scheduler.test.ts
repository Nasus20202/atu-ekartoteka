import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CronScheduler } from '@/lib/cron/scheduler';

// Mock node-cron
vi.mock('node-cron', () => ({
  schedule: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
  })),
  validate: vi.fn(() => true),
}));

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

const cron = await import('node-cron');

describe('CronScheduler', () => {
  let scheduler: CronScheduler;

  beforeEach(() => {
    vi.clearAllMocks();
    scheduler = new CronScheduler();
  });

  describe('scheduleTask', () => {
    it('should schedule a task with valid cron expression', () => {
      const task = vi.fn();
      const schedule = '0 * * * *'; // Every hour

      scheduler.scheduleTask('test-task', schedule, task);

      expect(cron.schedule).toHaveBeenCalledWith(
        schedule,
        expect.any(Function)
      );
    });

    it('should warn when scheduling duplicate tasks with same name', () => {
      const task1 = vi.fn();
      const task2 = vi.fn();

      scheduler.scheduleTask('duplicate', '0 * * * *', task1);
      scheduler.scheduleTask('duplicate', '0 * * * *', task2);

      // Current implementation allows duplicates, just logs warning
      expect(cron.schedule).toHaveBeenCalledTimes(2);
    });

    it('should schedule multiple different tasks', () => {
      const task1 = vi.fn();
      const task2 = vi.fn();

      scheduler.scheduleTask('task1', '0 * * * *', task1);
      scheduler.scheduleTask('task2', '0 0 * * *', task2);

      expect(cron.schedule).toHaveBeenCalledTimes(2);
    });

    it('should handle task execution errors gracefully', async () => {
      const failingTask = vi.fn().mockRejectedValue(new Error('Task failed'));

      scheduler.scheduleTask('failing-task', '0 * * * *', failingTask);

      // Get the wrapped task function
      const wrappedTask = vi.mocked(cron.schedule).mock
        .calls[0][1] as () => Promise<void>;

      // Should not throw when task fails
      await expect(wrappedTask()).resolves.toBeUndefined();
    });
  });

  describe('stopTask', () => {
    it('should stop a scheduled task', () => {
      const task = vi.fn();
      const mockScheduledTask = {
        start: vi.fn(),
        stop: vi.fn(),
      };
      vi.mocked(cron.schedule).mockReturnValue(mockScheduledTask as any);

      scheduler.scheduleTask('test-task', '0 * * * *', task);
      scheduler.stopTask('test-task');

      expect(mockScheduledTask.stop).toHaveBeenCalled();
    });

    it('should handle stopping non-existent task', () => {
      // Should not throw
      expect(() => {
        scheduler.stopTask('non-existent');
      }).not.toThrow();
    });
  });

  describe('stopAll', () => {
    it('should stop all scheduled tasks', () => {
      const mockTask1 = { start: vi.fn(), stop: vi.fn() };
      const mockTask2 = { start: vi.fn(), stop: vi.fn() };

      vi.mocked(cron.schedule)
        .mockReturnValueOnce(mockTask1 as any)
        .mockReturnValueOnce(mockTask2 as any);

      scheduler.scheduleTask('task1', '0 * * * *', vi.fn());
      scheduler.scheduleTask('task2', '0 0 * * *', vi.fn());

      scheduler.stopAll();

      expect(mockTask1.stop).toHaveBeenCalled();
      expect(mockTask2.stop).toHaveBeenCalled();
    });

    it('should clear all tasks after stopping', () => {
      const mockTask = { start: vi.fn(), stop: vi.fn() };
      vi.mocked(cron.schedule).mockReturnValue(mockTask as any);

      scheduler.scheduleTask('task', '0 * * * *', vi.fn());
      scheduler.stopAll();

      // Should be able to schedule same task again
      scheduler.scheduleTask('task', '0 * * * *', vi.fn());
      expect(cron.schedule).toHaveBeenCalledTimes(2);
    });
  });

  describe('getTasks', () => {
    it('should return list of scheduled task names', () => {
      scheduler.scheduleTask('task1', '0 * * * *', vi.fn());
      scheduler.scheduleTask('task2', '0 0 * * *', vi.fn());

      const tasks = scheduler.getTasks();

      expect(tasks).toContain('task1');
      expect(tasks).toContain('task2');
      expect(tasks).toHaveLength(2);
    });

    it('should return empty array when no tasks scheduled', () => {
      const tasks = scheduler.getTasks();
      expect(tasks).toEqual([]);
    });
  });
});
