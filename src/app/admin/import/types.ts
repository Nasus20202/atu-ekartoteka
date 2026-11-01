import type {
  ImportError,
  ImportErrorItem,
  ImportWarning,
  YearBalanceRow,
} from '@/lib/import/types';

export interface DatabaseStats {
  hoa: number;
  apartments: number;
  charges: number;
  notifications: number;
  payments: number;
  users: number;
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
