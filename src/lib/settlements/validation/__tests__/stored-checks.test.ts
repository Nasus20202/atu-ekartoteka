import { describe, expect, it } from 'vitest';

import { parsedUtilityRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import type {
  ApartmentCandidate,
  StoredReading,
} from '@/lib/settlements/types/stored-data';
import {
  checkMeterHistory,
  checkOverlap,
  checkOwnerPeriod,
} from '@/lib/settlements/validation/stored-checks';
import { toDecimal } from '@/lib/shared/utils/decimal';

const context = { fileName: 'a.pdf', subject: 'Lipowa 1' };
const FLAT = 'TST01-1';
const { readings } = parsedUtilityRecord();

const stored = (overrides: Partial<StoredReading> = {}): StoredReading => ({
  serialNumber: '7000001',
  externalApartmentId: FLAT,
  startDate: '2021-12-31',
  startValue: toDecimal('90'),
  endDate: '2022-04-30',
  endValue: toDecimal('105.5'),
  ...overrides,
});

const history = (...entries: StoredReading[]) =>
  checkMeterHistory(readings, entries, FLAT, context);

describe('checkOverlap', () => {
  it('refuses every overlapping period', () => {
    expect(
      checkOverlap(
        [{ periodFrom: '2022-09-01', periodTo: '2022-12-31' }],
        context
      )
    ).toEqual([
      expect.objectContaining({
        severity: 'error',
        kind: 'overlap',
        message: expect.stringContaining('01.09.2022–31.12.2022'),
      }),
    ]);
  });
});

describe('checkMeterHistory', () => {
  it('accepts readings that continue', () => {
    expect(history(stored())).toEqual([]);
  });

  it('accepts a gap between periods', () => {
    expect(
      history(stored({ endDate: '2021-09-30', endValue: toDecimal('99') }))
    ).toEqual([]);
  });

  it('warns about another start reading on the same date', () => {
    expect(history(stored({ endValue: toDecimal('105.4') }))).toEqual([
      expect.objectContaining({
        severity: 'warning',
        kind: 'continuity',
        message: expect.stringMatching(/105,5.*105,4/),
      }),
    ]);
  });

  it('warns when a later reading starts elsewhere', () => {
    const later = stored({
      startDate: '2022-09-30',
      startValue: toDecimal('120'),
      endDate: '2022-12-31',
    });

    expect(history(later)).toEqual([
      expect.objectContaining({ kind: 'continuity' }),
    ]);
  });

  it('warns about a meter stored for another apartment', () => {
    expect(history(stored({ externalApartmentId: 'TST01-2' }))).toEqual([
      expect.objectContaining({
        kind: 'serial',
        message: expect.stringContaining('TST01-2'),
      }),
    ]);
  });
});

describe('checkOwnerPeriod', () => {
  const period = { periodFrom: '2022-05-01', periodTo: '2022-09-30' };
  const owner = (validFrom: string | null, validTo: string | null) =>
    ({
      validFrom: validFrom ? new Date(validFrom) : null,
      validTo: validTo ? new Date(validTo) : null,
    }) as ApartmentCandidate;

  it.each([
    [null, null],
    ['2022-05-01', '2022-09-30'],
    ['2020-01-01', null],
  ])('accepts an owner from %s to %s', (from, to) => {
    expect(checkOwnerPeriod(owner(from, to), period, context)).toEqual([]);
  });

  it.each([
    ['2022-06-01', null],
    [null, '2022-08-31'],
  ])('warns about an owner from %s to %s', (from, to) => {
    expect(checkOwnerPeriod(owner(from, to), period, context)).toEqual([
      expect.objectContaining({ kind: 'owner-period', severity: 'warning' }),
    ]);
  });
});
