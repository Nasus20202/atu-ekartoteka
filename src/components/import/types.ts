import type { AssociationStatsDto } from '@/lib/admin/dto/association-stats-dto';
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

export interface ImportResult {
  hoaId: string;
  hoaName?: string;
  apartments: EntityStats;
  errors: ImportErrorItem[];
  warnings: ImportWarning[];
  charges?: EntityStats;
  notifications?: EntityStats;
  payments?: EntityStats;
  apartmentsDataDate?: string;
  chargesDataDate?: string;
  notificationsDataDate?: string;
  yearBalances?: YearBalanceRow[];
}

export interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  errors: ImportError[];
  fullValidationSkipped?: boolean;
}

/** The per-association totals of the import page, loaded when the section is first opened. */
export interface AssociationStatsState {
  items: AssociationStatsDto[] | null;
  loading: boolean;
  failed: boolean;
  request: () => void;
}
