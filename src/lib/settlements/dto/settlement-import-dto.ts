import type { SettlementDocumentType } from '@/lib/settlements/types/parsed-document';
import type {
  CheckedFile,
  ConfirmationReason,
  SettlementRecordStatus,
} from '@/lib/settlements/types/prepared-file';
import type { SettlementIssue } from '@/lib/settlements/types/settlement-issue';

export interface EncodedFile {
  name: string;
  /** Gzipped content in base64 */
  content: string;
}

export interface SettlementConfirmation {
  key: string;
  reason: ConfirmationReason;
}

export interface SettlementPreviewRecordDto {
  key: string;
  apartmentExternalId: string | null;
  apartmentLabel: string;
  printedOwner: string;
  matchedOwner: string | null;
  periodFrom: string;
  periodTo: string;
  totalAmount: string;
  status: SettlementRecordStatus;
  confirmations: ConfirmationReason[];
}

export interface SettlementPreviewFileDto {
  fileName: string;
  documentType: SettlementDocumentType | null;
  errors: SettlementIssue[];
  warnings: SettlementIssue[];
  records: SettlementPreviewRecordDto[];
}

export interface SettlementPreviewResponse {
  files: SettlementPreviewFileDto[];
  /** Stored settlements that a clean import would remove; 0 otherwise */
  removals: number;
}

export interface SettlementImportStats {
  created: number;
  updated: number;
  unchanged: number;
}

export interface SettlementImportFileDto {
  fileName: string;
  imported: boolean;
  stats: SettlementImportStats;
  errors: SettlementIssue[];
  warnings: SettlementIssue[];
}

export interface SettlementImportResponse {
  success: boolean;
  files: SettlementImportFileDto[];
  /** Stored settlements that a clean import removed; 0 otherwise */
  removed: number;
}

export function fileIssues({ issues, records }: CheckedFile) {
  const all = [...issues, ...records.flatMap((r) => r.issues)];
  return {
    errors: all.filter((i) => i.severity === 'error'),
    warnings: all.filter((i) => i.severity === 'warning'),
  };
}

export function toPreviewFile(file: CheckedFile): SettlementPreviewFileDto {
  return {
    fileName: file.fileName,
    documentType: file.documentType,
    ...fileIssues(file),
    records: file.records.map((entry) => ({
      key: entry.key,
      apartmentExternalId: entry.apartment?.externalApartmentId ?? null,
      apartmentLabel: entry.apartmentLabel,
      printedOwner: entry.record.printedOwner,
      matchedOwner: entry.apartment?.owner ?? null,
      periodFrom: entry.record.periodFrom,
      periodTo: entry.record.periodTo,
      totalAmount: entry.record.totalAmount.toFixed(2),
      status: entry.status,
      confirmations: entry.confirmations,
    })),
  };
}
