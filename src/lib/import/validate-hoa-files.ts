import { validateChargesCrossFile } from '@/lib/import/charges-cross-file';
import type { ParsedHoaFiles } from '@/lib/import/parse-hoa-files';
import type { HOAImportResult, ImportOptions } from '@/lib/import/types';
import { validateNalCzynsz, validateWplaty } from '@/lib/import/validators';
import type { NalCzynszEntry } from '@/lib/parsers/nal-czynsz-parser';
import type { PaymentEntry } from '@/lib/parsers/wplaty-parser';

/**
 * Runs the file checks on charge and payment entries, whether parsed from
 * files or loaded from the database. Adds warnings and blocking errors to the
 * result; returns false when the entries must not be imported.
 */
export function runValidators(
  chargeEntries: NalCzynszEntry[] | null | undefined,
  paymentEntries: PaymentEntry[] | undefined,
  result: HOAImportResult
): boolean {
  if (chargeEntries) {
    result.warnings.push(...validateNalCzynsz(chargeEntries));
  }

  if (paymentEntries) {
    const wplatyErrors = validateWplaty(paymentEntries);
    if (wplatyErrors.length > 0) {
      result.errors.push(...wplatyErrors);
      return false;
    }
  }

  if (chargeEntries && paymentEntries) {
    result.warnings.push(
      ...validateChargesCrossFile(chargeEntries, paymentEntries)
    );
  }

  return true;
}

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

  if (options.skipValidation) {
    return true;
  }

  return runValidators(chargeEntries, paymentData?.entries, result);
}
