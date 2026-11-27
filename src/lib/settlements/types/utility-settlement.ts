import type { UtilitySettlementLineKind } from '@/generated/prisma/browser';
import type { Decimal } from '@/lib/shared/utils/decimal';

// Dates are calendar days as "YYYY-MM-DD"; amounts are positive when to pay and
// negative when overpaid

export interface UtilityLine {
  kind: UtilitySettlementLineKind;
  description: string;
  dateFrom: string;
  dateTo: string;
  quantity: Decimal;
  unitPrice: Decimal;
  amount: Decimal;
}

export interface UtilitySummaryRow {
  code: string;
  consumption: Decimal;
  advanceQuantity: Decimal;
  difference: Decimal;
  amount: Decimal;
}

export interface MeterRow {
  device: string;
  serialNumber: string;
  label: string;
  unit: string;
  startDate: string;
  startValue: Decimal;
  endDate: string;
  endValue: Decimal;
  consumption: Decimal;
}

/** Printed total of one page next to the sum of that page's summary amounts. */
export interface UtilityPageTotal {
  page: number;
  total: Decimal;
  summarySum: Decimal;
}

export interface ParsedUtilityRecord {
  apartmentExternalId: string;
  printedOwner: string;
  periodFrom: string;
  periodTo: string;
  issuedOn: string;
  totalAmount: Decimal;
  lines: UtilityLine[];
  summaries: UtilitySummaryRow[];
  readings: MeterRow[];
  pageTotals: UtilityPageTotal[];
}
