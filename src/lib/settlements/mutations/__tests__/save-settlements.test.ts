import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  utilitySettlement: { create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  annualCostSettlement: {
    create: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import {
  parsedAnnualRecord,
  parsedUtilityRecord,
} from '@/__tests__/helpers/settlement-pdf/parsed-records';
import {
  replaceSettlements,
  saveSettlements,
} from '@/lib/settlements/mutations/save-settlements';
import type { SavableRecord } from '@/lib/settlements/types/prepared-file';

const checked = (
  type: 'utility' | 'annual',
  status: 'new' | 'changed'
): SavableRecord =>
  ({
    type,
    status,
    record: type === 'utility' ? parsedUtilityRecord() : parsedAnnualRecord(),
    apartment: { id: 'a1' },
  }) as SavableRecord;

const day = (value: string) => new Date(`${value}T00:00:00.000Z`);

describe('saveSettlements', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run) => run(db));
  });

  it('creates new records with numbered children in one transaction', async () => {
    await saveSettlements(
      [checked('utility', 'new'), checked('annual', 'new')],
      'a.pdf'
    );

    expect(db.$transaction).toHaveBeenCalledTimes(1);
    const utility = db.utilitySettlement.create.mock.calls[0][0].data;
    expect(utility).toMatchObject({
      apartmentId: 'a1',
      sourceFileName: 'a.pdf',
      printedOwner: 'Kowalska Anna',
      periodFrom: day('2022-05-01'),
      issuedOn: day('2022-10-03'),
    });
    expect(
      utility.lines.create.map((l: { lineNo: number }) => l.lineNo)
    ).toEqual([1, 2]);
    expect(utility.readings.create[0].endDate).toEqual(day('2022-09-30'));
    const annual = db.annualCostSettlement.create.mock.calls[0][0].data;
    expect(annual.items.create[0]).toMatchObject({
      lineNo: 1,
      periodTo: day('2025-12-31'),
    });
    expect(annual.items.create[0]).not.toHaveProperty('page');
    expect(db.utilitySettlement.update).not.toHaveBeenCalled();
  });

  it.each([
    ['utility', 'utilitySettlement', 'lines'],
    ['annual', 'annualCostSettlement', 'items'],
  ] as const)(
    'replaces the children of a changed %s record',
    async (type, model, children) => {
      await saveSettlements([checked(type, 'changed')], 'a.pdf');

      const { where, data } = db[model].update.mock.calls[0][0];
      expect(where.apartmentId_periodFrom_periodTo.apartmentId).toBe('a1');
      expect(data[children].deleteMany).toEqual({});
      expect(data[children].create.length).toBeGreaterThan(0);
      expect(db[model].create).not.toHaveBeenCalled();
    }
  );

  it('passes a failure on, so that nothing of the file is kept', async () => {
    db.utilitySettlement.create.mockRejectedValue(new Error('unique'));

    await expect(
      saveSettlements([checked('utility', 'new')], 'a.pdf')
    ).rejects.toThrow('unique');
  });
});

describe('replaceSettlements', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.$transaction.mockImplementation((run) => run(db));
    db.utilitySettlement.deleteMany.mockResolvedValue({ count: 2 });
    db.annualCostSettlement.deleteMany.mockResolvedValue({ count: 1 });
  });

  const periods = [{ periodFrom: '2022-05-01', periodTo: '2022-09-30' }];
  const replaced = (['utility', 'annual'] as const).map((type) => ({
    type,
    homeownersAssociationId: 'hoa-1',
    periods,
  }));

  it('removes the periods and writes every file in one transaction', async () => {
    const removed = await replaceSettlements(replaced, [
      { fileName: 'a.pdf', records: [checked('utility', 'new')] },
      { fileName: 'b.pdf', records: [checked('annual', 'new')] },
    ]);

    expect(removed).toEqual({ utility: 2, annual: 1 });
    expect(db.$transaction).toHaveBeenCalledTimes(1);
    expect(db.utilitySettlement.deleteMany).toHaveBeenCalledWith({
      where: {
        apartment: { homeownersAssociationId: 'hoa-1' },
        OR: [{ periodFrom: day('2022-05-01'), periodTo: day('2022-09-30') }],
      },
    });
    expect(
      db.utilitySettlement.deleteMany.mock.invocationCallOrder[0]
    ).toBeLessThan(db.utilitySettlement.create.mock.invocationCallOrder[0]);
    expect(
      db.annualCostSettlement.create.mock.calls[0][0].data.sourceFileName
    ).toBe('b.pdf');
  });

  it('passes a failure on, so that nothing is removed', async () => {
    db.utilitySettlement.create.mockRejectedValue(new Error('unique'));

    await expect(
      replaceSettlements(replaced, [
        { fileName: 'a.pdf', records: [checked('utility', 'new')] },
      ])
    ).rejects.toThrow('unique');
  });
});
