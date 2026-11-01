import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEntry,
  createExisting,
  createMockTx,
  createStats,
  ENDED_ON,
  FUTURE_END,
  HOA,
  IMPORT_DAY,
  STARTED_ON,
} from '@/lib/import/importers/__tests__/apartment-validity-mocks';
import { importApartments } from '@/lib/import/importers/apartments';
import { EntityStats } from '@/lib/import/types';

describe('importApartments former owner deactivation', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let stats: EntityStats;
  let errors: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    stats = createStats();
    errors = [];
  });

  it('deactivates a row in the file whose end date has passed', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validTo: ENDED_ON })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(mockTx.apartment.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ isActive: false })],
      skipDuplicates: true,
    });
  });

  it('keeps a row active when its end date is in the future', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([createExisting({ validTo: FUTURE_END })])
      .mockResolvedValueOnce([]);

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validTo: FUTURE_END })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(stats.updated).toBe(0);
    expect(mockTx.apartment.update).not.toHaveBeenCalled();
  });

  it('deactivates a row whose end date is the import day', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validTo: STARTED_ON })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(mockTx.apartment.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ isActive: false })],
      skipDuplicates: true,
    });
  });

  it('sets a previously active row inactive once its end date has passed', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([createExisting({ isActive: true })])
      .mockResolvedValueOnce([]);
    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validTo: ENDED_ON })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(stats.updated).toBe(1);
    expect(mockTx.apartment.update).toHaveBeenCalledWith({
      where: { id: 'apt-1' },
      data: expect.objectContaining({ validTo: ENDED_ON, isActive: false }),
    });
  });
});
