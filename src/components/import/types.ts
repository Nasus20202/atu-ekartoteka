import type {
  ImportError,
  ImportErrorItem,
} from '@/lib/import/types/import-error';
import type { ImportWarning } from '@/lib/import/types/import-warning';
import type { YearBalanceRow } from '@/lib/import/types/year-balance';

export interface DatabaseStats {
  hoa: number;
  apartments: number;
  charges: number;
  notifications: number;
  payments: number;
  users: number;
  utilitySettlements: number;
  meterReadings: number;
  annualSettlements: number;
}

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
