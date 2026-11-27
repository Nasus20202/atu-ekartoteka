import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHoaFindMany } = vi.hoisted(() => ({ mockHoaFindMany: vi.fn() }));

vi.mock('@/lib/platform/database/prisma', () => ({
  prisma: {
    homeownersAssociation: { findMany: mockHoaFindMany },
    payment: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { validateDatabase } from '@/lib/import/use-cases/validate-database';
import { importMetrics } from '@/lib/platform/opentelemetry/import-metrics';

describe('validateDatabase metrics', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('counts a validation that finds nothing as a success with no records', async () => {
    mockHoaFindMany.mockResolvedValue([]);
    const recordRun = vi.spyOn(importMetrics, 'recordRun');
    const recordRecords = vi.spyOn(importMetrics, 'recordRecords');
    const recordFinding = vi.spyOn(importMetrics, 'recordFinding');

    await validateDatabase();

    expect(recordRun).toHaveBeenCalledWith(
      'database_validation',
      'success',
      expect.any(Number)
    );
    expect(recordRecords).not.toHaveBeenCalled();
    expect(recordFinding).not.toHaveBeenCalled();
  });

  it('counts a validation that cannot read the database as a failure and rethrows', async () => {
    const error = new Error('connection lost');
    mockHoaFindMany.mockRejectedValue(error);
    const recordRun = vi.spyOn(importMetrics, 'recordRun');

    await expect(validateDatabase()).rejects.toBe(error);
    expect(recordRun).toHaveBeenCalledWith(
      'database_validation',
      'failure',
      expect.any(Number)
    );
  });
});
