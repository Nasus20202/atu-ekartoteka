import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  meterReading: { findMany: vi.fn(), groupBy: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import {
  findMeterOptions,
  findMeterReadings,
} from '@/lib/settlements/queries/find-meter-readings';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

const SCOPE = { apartmentId: 'a1' };
const NEWEST_FIRST = [{ endDate: 'desc' }, { device: 'asc' }, { id: 'asc' }];

describe('meter reading queries', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lists every meter, newest first, by default', async () => {
    await findMeterReadings(SCOPE, ALL_READINGS);

    expect(db.meterReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { settlement: SCOPE },
        orderBy: [{ endDate: 'desc' }, ...NEWEST_FIRST],
      })
    );
  });

  it('leaves the filter and the order to the database', async () => {
    await findMeterReadings(SCOPE, {
      meter: 'CW 01',
      sort: { key: 'consumption', direction: 'asc' },
    });

    expect(db.meterReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { settlement: SCOPE, device: 'CW 01' },
        orderBy: [{ consumption: 'asc' }, ...NEWEST_FIRST],
      })
    );
  });

  it('lists each meter of the scope once', async () => {
    db.meterReading.groupBy.mockResolvedValue([
      { device: 'CW 01', _max: { label: 'Ciepła woda' } },
      { device: 'ZW 01', _max: { label: null } },
    ]);

    expect(await findMeterOptions(SCOPE)).toEqual([
      { device: 'CW 01', label: 'Ciepła woda' },
      { device: 'ZW 01', label: 'ZW 01' },
    ]);
    expect(db.meterReading.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['device'],
        where: { settlement: SCOPE },
      })
    );
  });
});
