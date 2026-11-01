import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createEntry,
  createExisting,
  createMockTx,
  createStats,
  ENDED_ON,
  HOA,
  IMPORT_DAY,
  STARTED_ON,
} from '@/lib/import/importers/__tests__/apartment-validity-mocks';
import { importApartments } from '@/lib/import/importers/apartments';
import { EntityStats } from '@/lib/import/types';

describe('importApartments owner validity dates', () => {
  let mockTx: ReturnType<typeof createMockTx>;
  let stats: EntityStats;
  let errors: string[];

  beforeEach(() => {
    vi.clearAllMocks();
    mockTx = createMockTx();
    stats = createStats();
    errors = [];
  });

  it('creates a row with its dates and marks the current owner active', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    (mockTx.apartment.createMany as ReturnType<typeof vi.fn>).mockResolvedValue(
      { count: 1 }
    );

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validFrom: STARTED_ON, validTo: null })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(mockTx.apartment.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          validFrom: STARTED_ON,
          validTo: null,
          isActive: true,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it('creates a former owner row as inactive', async () => {
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
      data: [expect.objectContaining({ validTo: ENDED_ON, isActive: false })],
      skipDuplicates: true,
    });
  });

  it('counts a changed start date as an update', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([
        createExisting({ validFrom: new Date('2014-05-01T00:00:00Z') }),
      ])
      .mockResolvedValueOnce([]);
    (mockTx.apartment.update as ReturnType<typeof vi.fn>).mockResolvedValue({});

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validFrom: STARTED_ON })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(stats.updated).toBe(1);
    expect(mockTx.apartment.update).toHaveBeenCalledWith({
      where: { id: 'apt-1' },
      data: expect.objectContaining({ validFrom: STARTED_ON }),
    });
  });

  it('does not count an unchanged date as an update', async () => {
    (mockTx.apartment.findMany as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([createExisting({ validFrom: STARTED_ON })])
      .mockResolvedValueOnce([]);

    await importApartments(
      mockTx,
      HOA,
      [createEntry({ validFrom: STARTED_ON })],
      stats,
      errors,
      IMPORT_DAY
    );

    expect(stats.updated).toBe(0);
    expect(mockTx.apartment.update).not.toHaveBeenCalled();
  });
});
