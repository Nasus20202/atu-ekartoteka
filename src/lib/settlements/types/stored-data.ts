import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type { Decimal } from '@/lib/shared/utils/decimal';

/** A stored apartment record that a printed record may belong to. */
export interface ApartmentCandidate {
  id: string;
  externalApartmentId: string;
  homeownersAssociationId: string;
  owner: string | null;
  address: string | null;
  building: string | null;
  number: string;
  validFrom: Date | null;
  validTo: Date | null;
}

export interface ChargeRow {
  period: string;
  description: string;
  quantity: Decimal;
  unitPrice: Decimal;
  totalAmount: Decimal;
}

/** Charges of one description across a homeowners association in one year. */
export interface CommunityCharges {
  description: string;
  total: Decimal;
  /** Whether December has a charge with unit price 1, as allocations do */
  allocated: boolean;
}

export interface StoredPeriod {
  periodFrom: string;
  periodTo: string;
}

export interface StoredReading {
  serialNumber: string;
  externalApartmentId: string;
  startDate: string;
  startValue: Decimal;
  endDate: string;
  endValue: Decimal;
}

/** Stored settlements that a clean import removes before it writes. */
export interface ReplacedPeriods {
  type: SettlementDocumentType;
  homeownersAssociationId: string;
  periods: StoredPeriod[];
}
