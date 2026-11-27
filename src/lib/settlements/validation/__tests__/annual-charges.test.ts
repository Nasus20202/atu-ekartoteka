import { describe, expect, it } from 'vitest';

import { annualItem } from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  chargeRow,
  parsedAnnualRecord,
} from '@/__tests__/helpers/settlement-pdf/parsed-records';
import type {
  ChargeRow,
  CommunityCharges,
} from '@/lib/settlements/types/stored-data';
import { checkAnnualCharges } from '@/lib/settlements/validation/annual-charges';
import { toDecimal } from '@/lib/shared/utils/decimal';

const context = { fileName: 'a.pdf', subject: 'Lipowa 1' };
const ADVANCE = 'Zaliczka CW';
const BASIS = 'Wyrównanie zaliczek CW';

// Flat basis 1000: advances of 900 and a settlement of 100; allocation -32
const CHARGES: ChargeRow[] = [
  chargeRow('202501', ADVANCE, '30', '30', '900'),
  chargeRow('202509', BASIS, '4', '25', '100'),
  chargeRow('202512', BASIS, '-32', '1', '-32'),
];

// Community basis 25000 and amount -800
const community = (total = '24200', allocated = true): CommunityCharges[] => [
  { description: ADVANCE, total: toDecimal('20000'), allocated: false },
  {
    description: BASIS,
    total: toDecimal(total).minus(20000),
    allocated,
  },
];

const check = (
  charges = CHARGES,
  totals = community(),
  item = parsedAnnualRecord().items[0]
) => checkAnnualCharges(item, charges, totals, context);

describe('checkAnnualCharges', () => {
  it('finds nothing when the charges agree', () => {
    expect(check()).toEqual([]);
  });

  // A large overpayment can absorb the amount, so nothing is booked
  it('needs no allocation charge for an item', () => {
    expect(check(CHARGES.slice(0, 2))).toEqual([]);
  });

  it('takes the closest of two allocations out of the flat basis', () => {
    const charges = [
      ...CHARGES,
      chargeRow('202512', BASIS, '-31.99', '1', '-31.99'),
    ];

    expect(check(charges)).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('podstawa lokalu'),
      }),
    ]);
  });

  it('counts a December charge of another amount into the flat basis', () => {
    const charges = [
      ...CHARGES.slice(0, 2),
      chargeRow('202512', BASIS, '-31.9', '1', '-31.9'),
    ];

    expect(check(charges)).toEqual([
      expect.objectContaining({
        severity: 'error',
        kind: 'charges',
        message: expect.stringContaining('podstawa lokalu'),
      }),
    ]);
  });

  it('refuses another flat basis, advances included', () => {
    expect(check(CHARGES.slice(1))).toEqual([
      expect.objectContaining({
        severity: 'error',
        message: expect.stringContaining('podstawa lokalu'),
      }),
    ]);
  });

  it('counts only the months of a partial period', () => {
    const item = parsedAnnualRecord({
      items: [annualItem({ period: ['01/01/2025', '28/02/2025'] })],
    }).items[0];
    const charges = [
      chargeRow('202501', ADVANCE, '30', '30', '1000'),
      chargeRow('202503', ADVANCE, '30', '30', '500'),
      CHARGES[2],
    ];

    expect(check(charges, community(), item)).toEqual([]);
  });

  it('allows community totals 0,05 zł off and warns beyond', () => {
    expect(check(CHARGES, community('24200.05'))).toEqual([]);
    expect(check(CHARGES, community('24200.06'))).toEqual([
      expect.objectContaining({ severity: 'warning', kind: 'community' }),
    ]);
  });

  it('states that an item is not verified without allocations', () => {
    expect(check([], community('0', false))).toEqual([
      expect.objectContaining({
        severity: 'warning',
        kind: 'not-verified',
        page: 1,
        message: expect.stringContaining('Grudzień 2025'),
      }),
    ]);
  });
});
