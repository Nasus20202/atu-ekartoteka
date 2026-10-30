import { Prisma } from '@prisma/client/extension';

export type TransactionClient = Prisma.TransactionClient;

export interface ImportOptions {
  cleanImport?: boolean;
  skipValidation?: boolean;
}

export interface ImportFileGroup {
  // Several files of one kind (e.g. wplaty1.txt, wplaty2.txt) are merged
  lokFiles?: File[];
  chargesFiles?: File[];
  notificationsFiles?: File[];
  paymentsFiles?: File[];
  // Per-data-type WMB snapshot date files
  apartmentsWmbFile?: File;
  chargesWmbFile?: File;
  notificationsWmbFile?: File;
}

export interface EntityStats {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  total: number;
}

export interface ImportWarning {
  apartmentExternalId: string;
  period?: string;
  lineNo?: number;
  difference?: string;
  message: string;
}

export interface HOAImportResult {
  hoaId: string;
  apartments: EntityStats;
  charges?: EntityStats;
  notifications?: EntityStats;
  payments?: EntityStats;
  errors: string[];
  warnings: ImportWarning[];
  // Data-as-of dates from WMB files
  apartmentsDataDate?: Date;
  chargesDataDate?: Date;
  notificationsDataDate?: Date;
}

export interface ImportError {
  hoaId?: string;
  file?: string;
  error: string;
}

export interface BatchImportResult {
  success: boolean;
  results: HOAImportResult[];
  errors: ImportError[];
}

export interface HOAContext {
  id: string;
  externalId: string;
}

export interface ApartmentMap {
  map: Map<string, string>; // "externalOwnerId#externalApartmentId" -> id (UUID)
  apartmentKeysInFile: Set<string>; // Set of "externalOwnerId#externalApartmentId" keys
}
