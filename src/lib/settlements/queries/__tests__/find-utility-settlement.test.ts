import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  utilitySettlement: { findFirst: vi.fn() },
  utilitySettlementLine: { groupBy: vi.fn() },
  utilitySettlementSummary: { groupBy: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import {
  codeSumsOf,
  storedUtilityRow,
} from '@/__tests__/helpers/settlement-pdf/stored-rows';
import { findUtilitySettlement } from '@/lib/settlements/queries/find-utility-settlement';
import { toDecimal } from '@/lib/shared/utils/decimal';

const row = storedUtilityRow();
const [summary] = codeSumsOf(row);

describe('findUtilitySettlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.utilitySettlement.findFirst.mockResolvedValue(row);
    db.utilitySettlementLine.groupBy.mockResolvedValue([
      { kind: 'ADVANCE', _sum: { amount: toDecimal('480') } },
      { kind: 'CONSUMPTION', _sum: { amount: toDecimal('329.6') } },
    ]);
    const { code, ...sums } = summary;
    db.utilitySettlementSummary.groupBy.mockResolvedValue([
      { code, _sum: sums },
    ]);
  });

  it('reads nothing more when the scope holds no such record', async () => {
    db.utilitySettlement.findFirst.mockResolvedValue(null);

    expect(await findUtilitySettlement({ id: 'u9' })).toBeNull();
    expect(db.utilitySettlementLine.groupBy).not.toHaveBeenCalled();
    expect(db.utilitySettlementSummary.groupBy).not.toHaveBeenCalled();
  });

  it('adds up lines by kind and summary rows by code in the database', async () => {
    const result = await findUtilitySettlement({ id: 'u1' });

    expect(db.utilitySettlementLine.groupBy).toHaveBeenCalledWith({
      by: ['kind'],
      where: { settlementId: 'u1' },
      _sum: { amount: true },
    });
    expect(db.utilitySettlementSummary.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['code'],
        where: { settlementId: 'u1' },
        orderBy: { _min: { lineNo: 'asc' } },
      })
    );
    expect(result).toMatchObject({
      advanceAmount: '480',
      consumptionAmount: '329.6',
      printedOwner: row.printedOwner,
      origin: { sourceFileName: 'media.pdf' },
      totalAmount: row.totalAmount.toString(),
    });
    expect(result?.utilities).toHaveLength(1);
    expect(result?.utilities[0]).toMatchObject({
      code: 'CW',
      name: 'Ciepła woda',
      unit: 'm3',
      advanceQuantity: summary.advanceQuantity.toString(),
      amount: summary.amount.toString(),
    });
  });

  it('counts a kind without lines as zero', async () => {
    db.utilitySettlementLine.groupBy.mockResolvedValue([]);

    expect(await findUtilitySettlement({ id: 'u1' })).toMatchObject({
      advanceAmount: '0',
      consumptionAmount: '0',
    });
  });
});
