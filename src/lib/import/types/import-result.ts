import type {
  ImportError,
  ImportErrorItem,
} from '@/lib/import/types/import-error';
import type { ImportWarning } from '@/lib/import/types/import-warning';
import type { YearBalanceRow } from '@/lib/import/types/year-balance';

export interface EntityStats {
  created: number;
  updated: number;
  skipped: number;
  deleted: number;
  total: number;
}

export interface HOAImportResult {
  hoaId: string;
  hoaName?: string;
  apartments: EntityStats;
  charges?: EntityStats;
  notifications?: EntityStats;
  payments?: EntityStats;
  errors: ImportErrorItem[];
  warnings: ImportWarning[];
  // Data-as-of dates from WMB files
  apartmentsDataDate?: Date;
  chargesDataDate?: Date;
  notificationsDataDate?: Date;
  yearBalances?: YearBalanceRow[];
}

export interface BatchImportResult {
  success: boolean;
  results: HOAImportResult[];
  errors: ImportError[];
}
