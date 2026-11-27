import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  utilitySettlement: { count: vi.fn(), findMany: vi.fn() },
  annualCostSettlement: { count: vi.fn(), findMany: vi.fn() },
  meterReading: { findMany: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import { countReplacedSettlements } from '@/lib/settlements/queries/count-replaced-settlements';
import { findMeterHistory } from '@/lib/settlements/queries/find-meter-history';
import { findOverlappingPeriods } from '@/lib/settlements/queries/find-stored-periods';
import type { ReplacedPeriods } from '@/lib/settlements/types/stored-data';

const PERIOD = { periodFrom: '2022-05-01', periodTo: '2022-09-30' };
const DATES = {
  periodFrom: new Date('2022-05-01'),
  periodTo: new Date('2022-09-30'),
};
const scope = (type: ReplacedPeriods['type']): ReplacedPeriods => ({
  type,
  homeownersAssociationId: 'hoa-1',
  periods: [PERIOD],
});
const WHERE = {
  apartment: { homeownersAssociationId: 'hoa-1' },
  OR: [DATES],
};

describe('settlements a clean import replaces', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.utilitySettlement.findMany.mockResolvedValue([]);
    db.meterReading.findMany.mockResolvedValue([]);
  });

  it('counts both kinds in their own tables', async () => {
    db.utilitySettlement.count.mockResolvedValue(2);
    db.annualCostSettlement.count.mockResolvedValue(3);

    expect(
      await countReplacedSettlements([scope('utility'), scope('annual')])
    ).toBe(5);
    expect(db.utilitySettlement.count).toHaveBeenCalledWith({ where: WHERE });
    expect(db.annualCostSettlement.count).toHaveBeenCalledWith({
      where: WHERE,
    });
  });

  it('counts nothing without a scope', async () => {
    expect(await countReplacedSettlements([])).toBe(0);
  });

  it('leaves the replaced records of the kind out of the overlap check', async () => {
    await findOverlappingPeriods('utility', 'a1', PERIOD, [
      scope('utility'),
      scope('annual'),
    ]);

    expect(db.utilitySettlement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ NOT: [DATES, WHERE] }),
      })
    );
  });

  it('leaves the replaced readings out of the meter history', async () => {
    const reading = {
      serialNumber: '1',
      startDate: '2022-05-01',
      endDate: '2022-09-30',
    };

    await findMeterHistory(
      [reading as never],
      { id: 'a1', externalApartmentId: 'E1' },
      PERIOD,
      [scope('utility'), scope('annual')]
    );

    expect(db.meterReading.findMany.mock.calls[0][0].where.NOT).toEqual([
      { settlement: { apartmentId: 'a1', ...DATES } },
      { settlement: WHERE },
    ]);
  });
});
