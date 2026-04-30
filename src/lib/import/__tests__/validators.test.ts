import { describe, expect, it } from 'vitest';

import {
  validateChargesCrossFile,
  validateNalCzynsz,
  validateWplaty,
} from '@/lib/import/validators';
import { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import { PaymentEntry } from '@/lib/parsers/wplaty-parser';
import type { DecimalLike } from '@/lib/utils/decimal';

type NalCzynszEntryOverrides = Partial<
  Omit<NalCzynszEntry, 'quantity' | 'unitPrice' | 'totalAmount'>
> & {
  quantity?: DecimalLike;
  unitPrice?: DecimalLike;
  totalAmount?: DecimalLike;
};

type PaymentEntryOverrides = Partial<
  Omit<
    PaymentEntry,
    | 'openingDebt'
    | 'openingSurplus'
    | 'openingBalance'
    | 'totalCharges'
    | 'monthlyCharges'
    | 'monthlyPayments'
    | 'closingBalance'
  >
> & {
  openingDebt?: DecimalLike;
  openingSurplus?: DecimalLike;
  openingBalance?: DecimalLike;
  totalCharges?: DecimalLike;
  monthlyCharges?: DecimalLike[];
  monthlyPayments?: DecimalLike[];
  closingBalance?: DecimalLike;
};

function makeNalEntry(overrides: NalCzynszEntryOverrides = {}): NalCzynszEntry {
  return {
    id: 'NAL001',
    apartmentExternalId: 'APT001',
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-01-31'),
    period: '2024-01',
    lineNo: 1,
    description: 'Czynsz',
    quantity: 10,
    unit: 'm2',
    unitPrice: 5.5,
    totalAmount: 55.0,
    ...overrides,
  } as NalCzynszEntry;
}

function makePaymentEntry(overrides: PaymentEntryOverrides = {}): PaymentEntry {
  const monthlyCharges = Array(12).fill(0);
  const monthlyPayments = Array(12).fill(0);
  monthlyCharges[0] = 100;
  monthlyPayments[0] = 100;

  return {
    externalId: 'W001',
    apartmentCode: 'APT001',
    year: 2024,
    dateFrom: new Date('2024-01-01'),
    dateTo: new Date('2024-12-31'),
    openingDebt: 0,
    openingSurplus: 0,
    openingBalance: 0,
    totalCharges: 100,
    monthlyCharges,
    monthlyPayments,
    closingBalance: 0,
    ...overrides,
  } as PaymentEntry;
}

describe('validateNalCzynsz', () => {
  it('should return no errors for valid entries', () => {
    const entries = [
      makeNalEntry({ quantity: 10, unitPrice: 5.5, totalAmount: 55.0 }),
      makeNalEntry({ quantity: 1, unitPrice: 100, totalAmount: 100 }),
    ];
    const errors = validateNalCzynsz(entries);
    expect(errors).toHaveLength(0);
  });

  it('should return an error when totalAmount does not match quantity × unitPrice', () => {
    const entry = makeNalEntry({
      quantity: 10,
      unitPrice: 5.5,
      totalAmount: 60.0,
    });
    const errors = validateNalCzynsz([entry]);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('NAL001');
    expect(errors[0].message).toContain('60');
    expect(errors[0]).toMatchObject({
      apartmentExternalId: 'APT001',
      period: '2024-01',
      lineNo: 1,
      difference: '5.0000',
    });
  });

  it('should pass when difference is within tolerance (0.01)', () => {
    const entry = makeNalEntry({
      quantity: 10,
      unitPrice: 5.5,
      totalAmount: 55.009,
    });
    const errors = validateNalCzynsz([entry]);
    expect(errors).toHaveLength(0);
  });

  it('should fail when difference exceeds tolerance', () => {
    const entry = makeNalEntry({
      quantity: 10,
      unitPrice: 5.5,
      totalAmount: 55.02,
    });
    const errors = validateNalCzynsz([entry]);
    expect(errors).toHaveLength(1);
  });

  it('should return multiple errors for multiple invalid entries', () => {
    const entries = [
      makeNalEntry({
        id: 'NAL001',
        quantity: 10,
        unitPrice: 5.5,
        totalAmount: 60.0,
      }),
      makeNalEntry({
        id: 'NAL002',
        quantity: 2,
        unitPrice: 3.0,
        totalAmount: 10.0,
      }),
    ];
    const errors = validateNalCzynsz(entries);
    expect(errors).toHaveLength(2);
  });

  it('should return empty array for empty input', () => {
    expect(validateNalCzynsz([])).toHaveLength(0);
  });
});

describe('validateWplaty', () => {
  it('should return no errors when closing balance matches formula', () => {
    // closing = openingBalance + totalPayments - totalCharges
    // 0 + 100 - 100 = 0
    const entry = makePaymentEntry({
      openingBalance: 0,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [100, ...Array(11).fill(0)],
      closingBalance: 0,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(0);
  });

  it('should return an error when closing balance does not match formula', () => {
    // 0 + 100 - 100 = 0, but closingBalance is 50
    const entry = makePaymentEntry({
      openingBalance: 0,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [100, ...Array(11).fill(0)],
      closingBalance: 50,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('W001');
  });

  it('should handle positive opening balance', () => {
    // 200 + 100 - 100 = 200
    const entry = makePaymentEntry({
      openingBalance: 200,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [100, ...Array(11).fill(0)],
      closingBalance: 200,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(0);
  });

  it('should handle negative opening balance (debt)', () => {
    // -50 + 150 - 100 = 0
    const entry = makePaymentEntry({
      openingBalance: -50,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [150, ...Array(11).fill(0)],
      closingBalance: 0,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(0);
  });

  it('should pass when difference is within tolerance (0.01)', () => {
    const entry = makePaymentEntry({
      openingBalance: 0,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [100, ...Array(11).fill(0)],
      closingBalance: 0.009,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(0);
  });

  it('should fail when difference exceeds tolerance', () => {
    const entry = makePaymentEntry({
      openingBalance: 0,
      monthlyCharges: [100, ...Array(11).fill(0)],
      monthlyPayments: [100, ...Array(11).fill(0)],
      closingBalance: 0.02,
    });
    const errors = validateWplaty([entry]);
    expect(errors).toHaveLength(1);
  });

  it('should return empty array for empty input', () => {
    expect(validateWplaty([])).toHaveLength(0);
  });

  it('should return multiple errors for multiple invalid entries', () => {
    const entries = [
      makePaymentEntry({
        externalId: 'W001',
        openingBalance: 0,
        monthlyCharges: [100, ...Array(11).fill(0)],
        monthlyPayments: [100, ...Array(11).fill(0)],
        closingBalance: 50,
      }),
      makePaymentEntry({
        externalId: 'W002',
        openingBalance: 0,
        monthlyCharges: [200, ...Array(11).fill(0)],
        monthlyPayments: [200, ...Array(11).fill(0)],
        closingBalance: 100,
      }),
    ];
    const errors = validateWplaty(entries);
    expect(errors).toHaveLength(2);
  });
});

describe('validateChargesCrossFile', () => {
  function makeNal(
    apartmentExternalId: string,
    period: string,
    totalAmount: number
  ): NalCzynszEntry {
    return {
      id: 'NAL001',
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
    apartmentCode: string,
    year: number,
    monthlyCharges: number[]
  ): PaymentEntry {
    return {
      externalId: 'W001',
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

  it('returns no errors when nal_czynsz sums match wplaty monthly charges', () => {
    const nalEntries = [
      makeNal('APT001', '202501', 300),
      makeNal('APT001', '202501', 200),
    ];
    const paymentEntries = [
      makePayment('APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('returns error when nal_czynsz sum does not match wplaty monthly charge', () => {
    const nalEntries = [makeNal('APT001', '202501', 300)];
    const paymentEntries = [
      makePayment('APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('APT001');
    expect(errors[0]).toContain('202501');
  });

  it('skips months where both wplaty and nal are zero', () => {
    const nalEntries: NalCzynszEntry[] = [];
    const paymentEntries = [makePayment('APT001', 2025, Array(12).fill(0))];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('returns error when nal has charges but wplaty monthly charge is zero', () => {
    // Real-world case: last month in wplaty not yet settled but nal_czynsz already recorded
    const nalEntries = [makeNal('APT001', '202512', 500)];
    const paymentEntries = [
      makePayment('APT001', 2025, [...Array(11).fill(0), 0]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('APT001');
    expect(errors[0]).toContain('202512');
  });

  it('returns no errors when difference is within tolerance', () => {
    const nalEntries = [makeNal('APT001', '202501', 499.99)];
    const paymentEntries = [
      makePayment('APT001', 2025, [500, ...Array(11).fill(0)]),
    ];
    expect(validateChargesCrossFile(nalEntries, paymentEntries)).toHaveLength(
      0
    );
  });

  it('handles multiple apartments independently', () => {
    const nalEntries = [
      makeNal('APT001', '202501', 500),
      makeNal('APT002', '202501', 100), // wrong — should be 200
    ];
    const paymentEntries = [
      makePayment('APT001', 2025, [500, ...Array(11).fill(0)]),
      makePayment('APT002', 2025, [200, ...Array(11).fill(0)]),
    ];
    const errors = validateChargesCrossFile(nalEntries, paymentEntries);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('APT002');
  });

  it('returns no errors for empty inputs', () => {
    expect(validateChargesCrossFile([], [])).toHaveLength(0);
  });
});
