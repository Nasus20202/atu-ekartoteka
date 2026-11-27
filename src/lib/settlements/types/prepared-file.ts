import type { ParsedAnnualRecord } from '@/lib/settlements/types/annual-settlement';
import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';
import type { ApartmentCandidate } from '@/lib/settlements/types/stored-data';
import type { ParsedUtilityRecord } from '@/lib/settlements/types/utility-settlement';

export interface SettlementImportOptions {
  /** First removes the stored settlements of the same kind and periods */
  cleanImport: boolean;
  /** Reports the findings of the checks as warnings */
  skipValidation: boolean;
}

export interface SettlementUpload {
  fileName: string;
  data: Uint8Array;
}

export type SettlementRecord =
  | { type: 'utility'; record: ParsedUtilityRecord }
  | { type: 'annual'; record: ParsedAnnualRecord };

export type MatchedRecord = SettlementRecord & {
  /** The apartment as the file names it */
  apartmentLabel: string;
  /** Null when no single apartment record could be chosen */
  apartment: ApartmentCandidate | null;
  /** The owner name differs by an annotation, which the admin must accept */
  annotated: boolean;
  issues: SettlementIssue[];
};

/** A file that has been read and matched, before the checks against data. */
export interface PreparedFile {
  fileName: string;
  documentType: SettlementDocumentType | null;
  records: MatchedRecord[];
  /** Findings that belong to the file and not to one record */
  issues: SettlementIssue[];
}

export type SettlementRecordStatus =
  'new' | 'changed' | 'unchanged' | 'blocked';

export type ConfirmationReason = 'owner-annotation' | 'replace';

export type CheckedRecord = MatchedRecord & {
  /** Identifies the apartment, period and content that were checked */
  key: string;
  status: SettlementRecordStatus;
  confirmations: ConfirmationReason[];
};

/** A checked record whose apartment is known, so that it can be stored. */
export type SavableRecord = CheckedRecord & { apartment: ApartmentCandidate };

export interface CheckedFile extends Omit<PreparedFile, 'records'> {
  records: CheckedRecord[];
}
