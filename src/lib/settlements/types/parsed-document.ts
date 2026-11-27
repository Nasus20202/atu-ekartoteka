import type {
  AnnualOwnerTotal,
  ParsedAnnualRecord,
} from '@/lib/settlements/types/annual-settlement';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';

export type SettlementDocumentType = 'utility' | 'annual';

/** Why a part of a document could not be read; the file cannot be imported. */
export interface ParseProblem {
  kind: 'unreadable' | 'unknown-document' | 'unrecognised';
  page?: number;
  message: string;
}

export interface UtilityDocument {
  type: 'utility';
  records: ParsedUtilityRecord[];
  problems: ParseProblem[];
}

export interface AnnualDocument {
  type: 'annual';
  records: ParsedAnnualRecord[];
  ownerTotals: AnnualOwnerTotal[];
  problems: ParseProblem[];
}

export interface UnknownDocument {
  type: null;
  records: [];
  problems: ParseProblem[];
}

export type ParsedDocument = UtilityDocument | AnnualDocument | UnknownDocument;
