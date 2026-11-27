import type { Decimal } from '@/lib/shared/utils/decimal';

export interface AnnualItem {
  page: number;
  title: string;
  basisDescription: string;
  periodFrom: string;
  periodTo: string;
  communityAmount: Decimal;
  flatBasis: Decimal;
  communityBasis: Decimal;
  coefficient: Decimal;
  amount: Decimal;
}

/** Printed apartment total next to the sum of the items listed above it. */
export interface AnnualApartmentTotal {
  page: number;
  total: Decimal;
  itemSum: Decimal;
}

export interface ApartmentAddress {
  street: string;
  building: string;
  number: string;
}

export interface ParsedAnnualRecord {
  address: ApartmentAddress;
  /** The apartment as printed, e.g. "Lipowa 5 / 2" */
  apartmentLabel: string;
  printedOwner: string;
  periodFrom: string;
  periodTo: string;
  issuedOn: string;
  totalAmount: Decimal;
  items: AnnualItem[];
  apartmentTotals: AnnualApartmentTotal[];
}

/** Printed total of an owner next to the sum of that owner's apartment totals. */
export interface AnnualOwnerTotal {
  page: number;
  printedOwner: string;
  total: Decimal;
  apartmentSum: Decimal;
}
