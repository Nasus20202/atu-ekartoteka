import type { SettlementImportOptions } from '@/lib/settlements/types/prepared-file';

/** A checked import that keeps what is stored. */
export const STANDARD_IMPORT: SettlementImportOptions = {
  cleanImport: false,
  skipValidation: false,
};
