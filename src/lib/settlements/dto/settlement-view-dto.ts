import type { ReadingsQuery } from '@/lib/settlements/rules/readings-query';

// What the settlement views show. Dates are "YYYY-MM-DD" and decimal values are
// strings; amounts are positive when to pay and negative when overpaid.

export interface SettlementPeriodDto {
  id: string;
  periodFrom: string;
  periodTo: string;
}

export interface SettlementOriginDto {
  issuedOn: string;
  sourceFileName: string;
}

interface SettlementDocumentDto extends SettlementPeriodDto {
  /** Where the record came from; null for tenants */
  origin: SettlementOriginDto | null;
  printedOwner: string;
  totalAmount: string;
}

export interface SettlementLineDto {
  id: string;
  kind: 'ADVANCE' | 'CONSUMPTION';
  description: string;
  dateFrom: string;
  dateTo: string;
  quantity: string;
  unitPrice: string;
  amount: string;
}

export interface MeterReadingDto {
  id: string;
  device: string;
  serialNumber: string;
  label: string;
  unit: string;
  startDate: string;
  startValue: string;
  endDate: string;
  endValue: string;
  consumption: string;
  /** Name of the metered utility, or null when the device names none */
  utilityName: string | null;
}

export interface MeterOptionDto {
  device: string;
  label: string;
}

export interface UtilityDto {
  code: string;
  name: string;
  unit: string | null;
  consumption: string;
  advanceQuantity: string;
  difference: string;
  amount: string;
  lines: SettlementLineDto[];
  meters: MeterReadingDto[];
}

export interface UtilitySettlementDto extends SettlementDocumentDto {
  advanceAmount: string;
  consumptionAmount: string;
  utilities: UtilityDto[];
  /** Lines and meters that belong to no utility */
  otherLines: SettlementLineDto[];
  otherMeters: MeterReadingDto[];
}

export interface AnnualItemDto {
  id: string;
  name: string;
  title: string;
  basisDescription: string;
  periodFrom: string;
  periodTo: string;
  communityAmount: string;
  flatBasis: string;
  communityBasis: string;
  coefficient: string;
  amount: string;
}

export interface AnnualSettlementDto extends SettlementDocumentDto {
  items: AnnualItemDto[];
}

/** One apartment's settlements: the periods and the two selected records. */
export interface ApartmentSettlementsDto {
  utilityPeriods: SettlementPeriodDto[];
  utility: UtilitySettlementDto | null;
  /** Readings of every listed utility period, as `readingsQuery` asks */
  readings: MeterReadingDto[];
  /** Every meter with a reading in those periods */
  readingMeters: MeterOptionDto[];
  readingsQuery: ReadingsQuery;
  annualPeriods: SettlementPeriodDto[];
  annual: AnnualSettlementDto | null;
}
