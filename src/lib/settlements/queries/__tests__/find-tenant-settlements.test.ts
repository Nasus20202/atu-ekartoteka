import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  utilitySettlement: { findMany: vi.fn() },
  annualCostSettlement: { findMany: vi.fn(), findFirst: vi.fn() },
  meterReading: { findMany: vi.fn(), groupBy: vi.fn() },
}));
const findUtility = vi.hoisted(() => vi.fn());

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));
vi.mock('@/lib/settlements/queries/find-utility-settlement', () => ({
  findUtilitySettlement: findUtility,
}));

import { utilityDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import {
  storedAnnualRow,
  storedUtilityRow,
} from '@/__tests__/helpers/settlement-pdf/stored-rows';
import { findAdminSettlements } from '@/lib/settlements/queries/find-admin-settlements';
import { findTenantSettlements } from '@/lib/settlements/queries/find-tenant-settlements';
import type { SettlementSelection } from '@/lib/settlements/queries/load-apartment-settlements';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

const utilityRow = storedUtilityRow();
const annualRow = storedAnnualRow();
const TENANT_SCOPE = {
  apartmentId: 'a1',
  apartment: { userId: 'user-1' },
  periodTo: { gte: new Date('2024-01-01T00:00:00Z') },
};

describe('settlement reads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.utilitySettlement.findMany.mockResolvedValue([utilityRow]);
    db.annualCostSettlement.findMany.mockResolvedValue([annualRow]);
    db.annualCostSettlement.findFirst.mockResolvedValue(annualRow);
    db.meterReading.findMany.mockResolvedValue([
      {
        ...utilityRow.readings[0],
        settlement: { summaries: [{ code: 'CW' }] },
      },
    ]);
    db.meterReading.groupBy.mockResolvedValue([
      { device: 'CW 01', _max: { label: 'Ciepła woda' } },
    ]);
    findUtility.mockResolvedValue(utilityDto());
  });

  it('scopes every tenant read to the owner and the history window', async () => {
    await findTenantSettlements('user-1', 'a1', 2024, {});

    for (const model of [db.utilitySettlement, db.annualCostSettlement]) {
      expect(model.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: TENANT_SCOPE })
      );
    }
    expect(db.meterReading.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { settlement: TENANT_SCOPE } })
    );
    expect(db.meterReading.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ where: { settlement: TENANT_SCOPE } })
    );
    expect(findUtility).toHaveBeenCalledWith({ ...TENANT_SCOPE, id: 'u1' });
    expect(db.annualCostSettlement.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ...TENANT_SCOPE, id: 'r1' } })
    );
  });

  it('returns periods, the newest records and named readings', async () => {
    const result = await findTenantSettlements('user-1', 'a1', 2024, {});

    expect(result?.utilityPeriods).toEqual([
      { id: 'u1', periodFrom: '2022-05-01', periodTo: '2022-09-30' },
    ]);
    expect(result?.utility?.id).toBe('u1');
    expect(result?.annual?.id).toBe('r1');
    expect(result?.readings[0]).toMatchObject({ utilityName: 'Ciepła woda' });
  });

  it('keeps the document details from tenants', async () => {
    const result = await findTenantSettlements('user-1', 'a1', 2024, {});

    expect(result?.utility).toMatchObject({ origin: null });
    expect(result?.annual).toMatchObject({ origin: null });
    expect(JSON.stringify(result)).not.toMatch(/media\.pdf|roczne\.pdf/);
  });

  it.each<[string, SettlementSelection]>([
    ['utility', { utilityId: 'hidden' }],
    ['annual', { annualId: 'hidden' }],
  ])('finds nothing for a %s record outside the scope', async (_, selected) => {
    findUtility.mockResolvedValue(selected.utilityId ? null : utilityDto());
    db.annualCostSettlement.findFirst.mockResolvedValue(
      selected.annualId ? null : annualRow
    );

    expect(
      await findTenantSettlements('user-1', 'a1', 2024, selected)
    ).toBeNull();
  });

  it('is empty for an apartment without settlements', async () => {
    db.utilitySettlement.findMany.mockResolvedValue([]);
    db.annualCostSettlement.findMany.mockResolvedValue([]);
    db.meterReading.findMany.mockResolvedValue([]);
    db.meterReading.groupBy.mockResolvedValue([]);

    expect(await findTenantSettlements('user-1', 'a1', 2024, {})).toEqual({
      utilityPeriods: [],
      utility: null,
      readings: [],
      readingMeters: [],
      readingsQuery: ALL_READINGS,
      annualPeriods: [],
      annual: null,
    });
    expect(findUtility).not.toHaveBeenCalled();
    expect(db.annualCostSettlement.findFirst).not.toHaveBeenCalled();
  });

  it('lets an admin read the full history of one apartment record', async () => {
    const result = await findAdminSettlements('a1', { utilityId: 'u1' });

    expect(db.utilitySettlement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { apartmentId: 'a1' } })
    );
    expect(findUtility).toHaveBeenCalledWith({ apartmentId: 'a1', id: 'u1' });
    expect(result?.utility?.id).toBe('u1');
    expect(result?.utility?.origin?.sourceFileName).toBe('media.pdf');
    expect(result?.annual?.origin?.sourceFileName).toBe('roczne.pdf');
  });
});
