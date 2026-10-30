import type { ParsedHoaFiles } from '@/lib/import/parse-hoa-files';
import type { HOAImportResult, ImportOptions } from '@/lib/import/types';
import {
  validateChargesCrossFile,
  validateNalCzynsz,
  validateWplaty,
} from '@/lib/import/validators';

/**
 * Adds warnings and blocking errors to the result.
 * Returns false when the import must stop before the transaction.
 */
export function validateHoaFiles(
  { chargeEntries, paymentData, duplicateErrors }: ParsedHoaFiles,
  result: HOAImportResult,
  options: ImportOptions
): boolean {
  // Merged files must not repeat records, even when validation is skipped
  if (duplicateErrors.length > 0) {
    result.errors.push(...duplicateErrors);
    return false;
  }

  if (chargeEntries && !options.skipValidation) {
    const nalWarnings = validateNalCzynsz(chargeEntries);
    if (nalWarnings.length > 0) {
      result.warnings.push(...nalWarnings);
    }
  }

  if (paymentData && !options.skipValidation) {
    const wplatyErrors = validateWplaty(paymentData.entries);
    if (wplatyErrors.length > 0) {
      result.errors.push(...wplatyErrors);
      return false;
    }
  }

  if (chargeEntries && paymentData && !options.skipValidation) {
    const crossErrors = validateChargesCrossFile(
      chargeEntries,
      paymentData.entries
    );
    if (crossErrors.length > 0) {
      result.errors.push(...crossErrors);
      return false;
    }
  }

  return true;
}
