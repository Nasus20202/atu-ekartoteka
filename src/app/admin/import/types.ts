import type { ImportWarning } from '@/lib/import/types';

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
  apartments: EntityStats;
  errors: string[];
  warnings: ImportWarning[];
  charges?: EntityStats;
  notifications?: EntityStats;
  payments?: EntityStats;
  apartmentsDataDate?: string;
  chargesDataDate?: string;
  notificationsDataDate?: string;
}

export interface ImportResponse {
  success: boolean;
  results: ImportResult[];
  errors: Array<{ hoaId?: string; file?: string; error: string }>;
}
