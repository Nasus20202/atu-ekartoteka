import { describe, expect, it } from 'vitest';

import {
  type AssociationStatsSource,
  buildAssociationStatsRows,
} from '@/lib/admin/rules/association-stats-rows';

const EMPTY_SOURCE: AssociationStatsSource = {
  associations: [],
  apartmentCounts: [],
  apartments: [],
  charges: [],
  notifications: [],
  payments: [],
  utilitySettlements: [],
  annualSettlements: [],
};

const ALFA = {
  id: 'hoa-alfa',
  name: 'Alfa',
  apartmentsDataDate: new Date('2025-01-15T00:00:00.000Z'),
  chargesDataDate: null,
  notificationsDataDate: new Date('2025-01-20T00:00:00.000Z'),
};

const BETA = {
  id: 'hoa-beta',
  name: 'Beta',
  apartmentsDataDate: null,
  chargesDataDate: null,
  notificationsDataDate: null,
};

const SOURCE: AssociationStatsSource = {
  associations: [ALFA, BETA],
  apartmentCounts: [
    { homeownersAssociationId: 'hoa-alfa', count: 2 },
    { homeownersAssociationId: 'hoa-beta', count: 1 },
  ],
  apartments: [
    { id: 'apt-1', homeownersAssociationId: 'hoa-alfa' },
    { id: 'apt-2', homeownersAssociationId: 'hoa-alfa' },
    { id: 'apt-3', homeownersAssociationId: 'hoa-beta' },
  ],
  charges: [
    { apartmentId: 'apt-1', count: 10, lastPeriod: '202501' },
    { apartmentId: 'apt-2', count: 5, lastPeriod: '202512' },
    { apartmentId: 'apt-3', count: 0, lastPeriod: null },
  ],
  notifications: [{ apartmentId: 'apt-2', count: 3 }],
  payments: [
    { apartmentId: 'apt-1', count: 1 },
    { apartmentId: 'apt-2', count: 1 },
  ],
  utilitySettlements: [],
  annualSettlements: [{ apartmentId: 'apt-3', count: 4 }],
};

describe('buildAssociationStatsRows', () => {
  it('returns no rows without associations', () => {
    expect(buildAssociationStatsRows(EMPTY_SOURCE)).toEqual([]);
  });

  it('sums the per-apartment counts of each association', () => {
    const [alfa, beta] = buildAssociationStatsRows(SOURCE);

    expect(alfa).toMatchObject({
      id: 'hoa-alfa',
      name: 'Alfa',
      apartments: 2,
      charges: 15,
      notifications: 3,
      payments: 2,
      utilitySettlements: 0,
      annualSettlements: 0,
    });
    expect(beta).toMatchObject({
      id: 'hoa-beta',
      apartments: 1,
      charges: 0,
      notifications: 0,
      payments: 0,
      annualSettlements: 4,
    });
  });

  it('takes the newest charge period across the apartments of an association', () => {
    const [alfa] = buildAssociationStatsRows(SOURCE);

    expect(alfa.lastChargePeriod).toBe('2025-12-01T00:00:00.000Z');
  });

  it('gives an association without charges a null last period', () => {
    const [, beta] = buildAssociationStatsRows(SOURCE);

    expect(beta.lastChargePeriod).toBeNull();
  });

  it('gives an association without apartments or records zero counts and null dates', () => {
    const rows = buildAssociationStatsRows({
      ...EMPTY_SOURCE,
      associations: [BETA],
    });

    expect(rows).toEqual([
      {
        id: 'hoa-beta',
        name: 'Beta',
        apartments: 0,
        charges: 0,
        notifications: 0,
        payments: 0,
        utilitySettlements: 0,
        annualSettlements: 0,
        lastChargePeriod: null,
        apartmentsDataDate: null,
        chargesDataDate: null,
        notificationsDataDate: null,
      },
    ]);
  });

  it('returns the data dates as ISO strings', () => {
    const [alfa] = buildAssociationStatsRows(SOURCE);

    expect(alfa.apartmentsDataDate).toBe('2025-01-15T00:00:00.000Z');
    expect(alfa.chargesDataDate).toBeNull();
    expect(alfa.notificationsDataDate).toBe('2025-01-20T00:00:00.000Z');
  });

  it('keeps the order of the associations it was given', () => {
    const rows = buildAssociationStatsRows({
      ...SOURCE,
      associations: [BETA, ALFA],
    });

    expect(rows.map((row) => row.id)).toEqual(['hoa-beta', 'hoa-alfa']);
    expect(rows[1].charges).toBe(15);
  });

  it('ignores counts of apartments that no association in the source owns', () => {
    const rows = buildAssociationStatsRows({
      ...SOURCE,
      charges: [
        ...SOURCE.charges,
        { apartmentId: 'apt-removed', count: 99, lastPeriod: '209901' },
      ],
    });

    expect(rows[0].charges).toBe(15);
    expect(rows[0].lastChargePeriod).toBe('2025-12-01T00:00:00.000Z');
  });

  it('is deterministic for the same source', () => {
    expect(buildAssociationStatsRows(SOURCE)).toEqual(
      buildAssociationStatsRows(SOURCE)
    );
  });
});
