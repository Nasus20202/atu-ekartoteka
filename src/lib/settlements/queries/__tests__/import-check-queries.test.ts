import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  apartment: { findMany: vi.fn() },
  charge: { findMany: vi.fn(), groupBy: vi.fn() },
  utilitySettlement: { findMany: vi.fn() },
  annualCostSettlement: { findMany: vi.fn() },
  meterReading: { findMany: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import { parsedUtilityRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import {
  findCandidatesByAddress,
  findCandidatesByExternalId,
} from '@/lib/settlements/queries/find-match-candidates';
import { findMeterHistory } from '@/lib/settlements/queries/find-meter-history';
import {
  findApartmentCharges,
  findCommunityCharges,
} from '@/lib/settlements/queries/find-settlement-charges';
import { findOverlappingPeriods } from '@/lib/settlements/queries/find-stored-periods';
import { toDecimal } from '@/lib/shared/utils/decimal';

const PERIOD = { periodFrom: '2022-05-01', periodTo: '2022-09-30' };
const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('settlement import queries', () => {
  beforeEach(() => vi.resetAllMocks());

  it('finds candidates by the external apartment ID', async () => {
    await findCandidatesByExternalId('TST01-1');

    expect(db.apartment.findMany.mock.calls[0][0].where).toEqual({
      externalApartmentId: 'TST01-1',
    });
  });

  it('finds candidates by number, building and the end of the street', async () => {
    await findCandidatesByAddress({
      street: 'Lipowa',
      building: '22 B',
      number: '15',
    });

    expect(db.apartment.findMany.mock.calls[0][0].where).toEqual({
      number: { equals: '15', mode: 'insensitive' },
      building: { equals: '22 B', mode: 'insensitive' },
      OR: [
        { address: { equals: 'Lipowa', mode: 'insensitive' } },
        { address: { endsWith: ' Lipowa', mode: 'insensitive' } },
      ],
    });
  });

  it('reads the apartment charges of the requested months', async () => {
    await findApartmentCharges('a1', ['202205']);

    expect(db.charge.findMany.mock.calls[0][0].where).toEqual({
      apartmentId: 'a1',
      period: { in: ['202205'] },
    });
  });

  it('sums the community charges of a year in the database', async () => {
    db.charge.groupBy
      .mockResolvedValueOnce([
        { description: 'A', _sum: { totalAmount: toDecimal('5') } },
        { description: 'B', _sum: { totalAmount: null } },
      ])
      .mockResolvedValueOnce([{ description: 'A' }]);

    const charges = await findCommunityCharges('hoa', 2025);

    expect(db.charge.groupBy.mock.calls[0][0].where).toEqual({
      apartment: { homeownersAssociationId: 'hoa' },
      period: { gte: '202501', lte: '202512' },
    });
    expect(db.charge.groupBy.mock.calls[1][0].where).toMatchObject({
      period: '202512',
      unitPrice: 1,
    });
    expect(
      charges.map((c) => [c.description, c.total.toString(), c.allocated])
    ).toEqual([
      ['A', '5', true],
      ['B', '0', false],
    ]);
  });

  it.each([
    ['utility', 'utilitySettlement'],
    ['annual', 'annualCostSettlement'],
  ] as const)(
    'finds overlapping %s periods without the same one',
    async (type, model) => {
      db[model].findMany.mockResolvedValue([
        { periodFrom: day('2022-09-01'), periodTo: day('2022-12-31') },
      ]);

      const periods = await findOverlappingPeriods(type, 'a1', PERIOD);

      expect(db[model].findMany.mock.calls[0][0].where).toEqual({
        apartmentId: 'a1',
        periodFrom: { lte: day('2022-09-30') },
        periodTo: { gte: day('2022-05-01') },
        NOT: [{ periodFrom: day('2022-05-01'), periodTo: day('2022-09-30') }],
      });
      expect(periods).toEqual([
        { periodFrom: '2022-09-01', periodTo: '2022-12-31' },
      ]);
    }
  );

  it('asks nothing for a record without meters', async () => {
    expect(
      await findMeterHistory([], { id: 'a1', externalApartmentId: 'x' }, PERIOD)
    ).toEqual([]);
    expect(db.meterReading.findMany).not.toHaveBeenCalled();
  });

  it('reads meeting readings and other apartments, not the replaced record', async () => {
    db.meterReading.findMany.mockResolvedValue([
      {
        serialNumber: '7000001',
        startDate: day('2022-01-01'),
        startValue: toDecimal('1'),
        endDate: day('2022-04-30'),
        endValue: toDecimal('2'),
        settlement: { apartment: { externalApartmentId: 'other' } },
      },
    ]);

    const history = await findMeterHistory(
      parsedUtilityRecord().readings,
      { id: 'a1', externalApartmentId: 'TST01-1' },
      PERIOD
    );

    const { where } = db.meterReading.findMany.mock.calls[0][0];
    expect(where.NOT).toEqual([
      { settlement: expect.objectContaining({ apartmentId: 'a1' }) },
    ]);
    expect(where.OR).toHaveLength(3);
    expect(history[0]).toMatchObject({
      endDate: '2022-04-30',
      externalApartmentId: 'other',
    });
  });
});
