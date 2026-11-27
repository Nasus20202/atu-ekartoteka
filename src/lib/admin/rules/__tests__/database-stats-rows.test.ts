import { describe, expect, it } from 'vitest';

import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
import type { DatabaseStatsDto } from '@/lib/admin/dto/database-stats-dto';
import {
  buildDataDateLines,
  buildSummaryRows,
} from '@/lib/admin/rules/database-stats-rows';
import { EMPTY_VALUE } from '@/lib/admin/rules/stats-format';

const EMPTY = {
  count: 0,
  rangeFrom: null,
  rangeTo: null,
  lastChangedAt: null,
};

const STATS: DatabaseStatsDto = {
  hoa: {
    count: 2,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: '2026-02-03T10:00:00.000Z',
  },
  apartments: {
    count: 7,
    active: 5,
    rangeFrom: null,
    rangeTo: null,
    lastChangedAt: null,
  },
  users: EMPTY,
  charges: {
    count: 40,
    rangeFrom: '2025-01-01T00:00:00.000Z',
    rangeTo: '2025-12-01T00:00:00.000Z',
    lastChangedAt: '2026-02-03T10:00:00.000Z',
  },
  notifications: EMPTY,
  payments: EMPTY,
  utilitySettlements: EMPTY,
  meterReadings: EMPTY,
  annualSettlements: EMPTY,
};

describe('buildSummaryRows', () => {
  it('returns one row per data type in table order', () => {
    expect(buildSummaryRows(STATS).map((row) => row.label)).toEqual([
      'Wspólnoty',
      'Mieszkania',
      'Użytkownicy',
      'Naliczenia',
      'Powiadomienia',
      'Wpłaty',
      'Rozliczenia mediów',
      'Odczyty liczników',
      'Koszty rzeczywiste',
    ]);
  });

  it('shows the active apartments under the apartment count', () => {
    const apartments = buildSummaryRows(STATS)[1];

    expect(apartments).toMatchObject({ count: '7', detail: 'aktywne: 5' });
  });

  it('shows the charge periods as months and the other ranges as days', () => {
    const [, , , charges] = buildSummaryRows(STATS);

    expect(charges.range).toBe('01.2025 – 12.2025');
    expect(charges.changedAt).toMatch(/^\d{2}\.\d{2}\.2026$/);
  });

  it('shows dashes for a type without a range or a last change', () => {
    const [hoa, , , , notifications] = buildSummaryRows(STATS);

    expect(hoa).toMatchObject({ detail: null, range: EMPTY_VALUE });
    expect(notifications).toMatchObject({
      count: '0',
      range: EMPTY_VALUE,
      changedAt: EMPTY_VALUE,
    });
  });
});

describe('buildDataDateLines', () => {
  const DATE = '2025-01-15T00:00:00.000Z';
  const OTHER_DATE = '2025-01-20T00:00:00.000Z';

  function association(
    dates: Pick<
      AssociationStatsDto,
      'apartmentsDataDate' | 'chargesDataDate' | 'notificationsDataDate'
    >
  ): AssociationStatsDto {
    return {
      id: 'hoa-1',
      name: 'Alfa',
      apartments: 0,
      charges: 0,
      notifications: 0,
      payments: 0,
      utilitySettlements: 0,
      annualSettlements: 0,
      lastChargePeriod: null,
      ...dates,
    };
  }

  it('labels each data date and shows a dash when it is missing', () => {
    expect(
      buildDataDateLines(
        association({
          apartmentsDataDate: DATE,
          chargesDataDate: null,
          notificationsDataDate: OTHER_DATE,
        })
      )
    ).toEqual([
      { label: 'Mieszkania', value: '15.01.2025' },
      { label: 'Naliczenia', value: EMPTY_VALUE },
      { label: 'Powiadomienia', value: '20.01.2025' },
    ]);
  });

  it('shows one shared line when all three dates are the same', () => {
    expect(
      buildDataDateLines(
        association({
          apartmentsDataDate: DATE,
          chargesDataDate: DATE,
          notificationsDataDate: DATE,
        })
      )
    ).toEqual([{ label: 'Dane na dzień', value: '15.01.2025' }]);
  });

  it('shows one shared dash when all three dates are missing', () => {
    expect(
      buildDataDateLines(
        association({
          apartmentsDataDate: null,
          chargesDataDate: null,
          notificationsDataDate: null,
        })
      )
    ).toEqual([{ label: 'Dane na dzień', value: EMPTY_VALUE }]);
  });

  it('keeps all three lines when only one date differs', () => {
    expect(
      buildDataDateLines(
        association({
          apartmentsDataDate: DATE,
          chargesDataDate: DATE,
          notificationsDataDate: OTHER_DATE,
        })
      )
    ).toEqual([
      { label: 'Mieszkania', value: '15.01.2025' },
      { label: 'Naliczenia', value: '15.01.2025' },
      { label: 'Powiadomienia', value: '20.01.2025' },
    ]);
  });
});
