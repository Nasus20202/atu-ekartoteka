import { describe, expect, it } from 'vitest';

import { validateChargesCrossFile } from '@/lib/import/validators';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';

const OWNER = 'W001';

function makeNal(
  ownerId: string,
  apartmentExternalId: string,
  period: string,
  totalAmount: number
): NalCzynszEntry {
  return {
    id: ownerId,
    apartmentExternalId,
    dateFrom: new Date('2025-01-01'),
    dateTo: new Date('2025-01-31'),
    period,
    lineNo: 1,
    description: 'Czynsz',
    quantity: 1,
    unit: 'szt',
    unitPrice: totalAmount,
    totalAmount,
  } as unknown as NalCzynszEntry;
}

function makePayment(
  ownerId: string,
  apartmentCode: string,
  year: number,
  monthlyCharges: number[]
): PaymentEntry {
  return {
    externalId: ownerId,
    apartmentCode,
    year,
    dateFrom: new Date(`${year}-01-01`),
    dateTo: new Date(`${year}-12-31`),
    openingDebt: 0,
    openingSurplus: 0,
    openingBalance: 0,
    totalCharges: monthlyCharges.reduce((s, v) => s + v, 0),
    monthlyCharges,
    monthlyPayments: Array(12).fill(0),
    closingBalance: 0,
  } as unknown as PaymentEntry;
}

describe('validateChargesCrossFile', () => {
  it('returns no errors when nal_czynsz sums match wplaty monthly charges', () => {
    const nalEntries = [
      makeNal(OWNER, 'APT001', '202501', 300),
      makeNal(OWNER, 'APT001', '202501', 200),
    ];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('returns error when nal_czynsz sum does not match wplaty monthly charge', () => {
    const nalEntries = [makeNal(OWNER, 'APT001', '202501', 300)];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      `Lokal APT001 (właściciel ${OWNER}), okres 202501`
    );
  });

  it('skips months where both wplaty and nal are zero', () => {
    const nalEntries: NalCzynszEntry[] = [];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, Array(12).fill(0)),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('returns error when nal has charges but wplaty monthly charge is zero', () => {
    // Real-world case: last month in wplaty not yet settled but nal_czynsz already recorded
    const nalEntries = [makeNal(OWNER, 'APT001', '202512', 500)];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, [...Array(11).fill(0), 0]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('APT001');
    expect(errors[0]).toContain('202512');
  });

  it('returns no errors when difference is within tolerance', () => {
    const nalEntries = [makeNal(OWNER, 'APT001', '202501', 499.99)];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('handles multiple apartments independently', () => {
    const nalEntries = [
      makeNal(OWNER, 'APT001', '202501', 500),
      makeNal(OWNER, 'APT002', '202501', 100), // wrong — should be 200
    ];
    const paymentEntries = [
      makePayment(OWNER, 'APT001', 2025, [500, ...Array(11).fill(0)]),
      makePayment(OWNER, 'APT002', 2025, [200, ...Array(11).fill(0)]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('APT002');
  });

  it('returns no errors for empty inputs', () => {
    expect(validateChargesCrossFile([], [])).toHaveLength(0);
  });
});

describe('validateChargesCrossFile with owner changes', () => {
  const FORMER_OWNER = 'W00097';
  const CURRENT_OWNER = 'W00513';
  const APARTMENT = 'SYM17-SYM17-00000-00009M';

  it('passes when the former owner row has no charges and nal lists only the current owner', () => {
    const nalEntries = [
      makeNal(CURRENT_OWNER, APARTMENT, '202601', 1002.65),
      makeNal(CURRENT_OWNER, APARTMENT, '202602', 1002.65),
    ];
    const paymentEntries = [
      makePayment(FORMER_OWNER, APARTMENT, 2026, Array(12).fill(0)),
      makePayment(CURRENT_OWNER, APARTMENT, 2026, [
        1002.65,
        1002.65,
        ...Array(10).fill(0),
      ]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('passes on a mid-year change when each owner has matching charges', () => {
    const nalEntries = [
      makeNal(FORMER_OWNER, APARTMENT, '202601', 400),
      makeNal(CURRENT_OWNER, APARTMENT, '202602', 500),
    ];
    const paymentEntries = [
      makePayment(FORMER_OWNER, APARTMENT, 2026, [400, ...Array(11).fill(0)]),
      makePayment(CURRENT_OWNER, APARTMENT, 2026, [
        0,
        500,
        ...Array(10).fill(0),
      ]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it("does not count another owner's charges toward a wplaty row", () => {
    const nalEntries = [makeNal(CURRENT_OWNER, APARTMENT, '202601', 400)];
    const paymentEntries = [
      makePayment(FORMER_OWNER, APARTMENT, 2026, [400, ...Array(11).fill(0)]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain(
      `Lokal ${APARTMENT} (właściciel ${FORMER_OWNER}), okres 202601`
    );
  });
});
