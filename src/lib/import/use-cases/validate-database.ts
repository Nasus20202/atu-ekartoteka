import { validateBalanceDrift } from '@/lib/import/pipeline/balance-drift-validation';
import {
  loadChargeEntries,
  loadPaymentRows,
  toBalanceSources,
  toPaymentEntries,
} from '@/lib/import/pipeline/load-stored-entries';
import { loadYearBalances } from '@/lib/import/pipeline/load-year-balances';
import { runValidators } from '@/lib/import/pipeline/validate-hoa-files';
import { IMPORT_HOA_CONCURRENCY } from '@/lib/import/rules/constants';
import { createEmptyStats, mapWithConcurrency } from '@/lib/import/rules/utils';
import type {
  BatchImportResult,
  HOAImportResult,
} from '@/lib/import/types/import-result';
import { validateCrossYearBalances } from '@/lib/import/validation/cross-year-validation';
import { withYearStatus } from '@/lib/import/validation/year-status';
import { prisma } from '@/lib/platform/database/prisma';

type ApartmentKeys = { externalOwnerId: string; externalApartmentId: string };

function apartmentKey({
  externalOwnerId,
  externalApartmentId,
}: ApartmentKeys): string {
  return `${externalOwnerId}#${externalApartmentId}`;
}

async function validateHoa(
  hoa: { id: string; externalId: string; name: string },
  skipFullValidation: boolean
): Promise<HOAImportResult> {
  const result: HOAImportResult = {
    hoaId: hoa.externalId,
    hoaName: hoa.name,
    apartments: createEmptyStats(),
    errors: [],
    warnings: [],
  };

  if (skipFullValidation) {
    const paymentRows = await loadPaymentRows(hoa.id);
    const yearBalances = await loadYearBalances(toBalanceSources(paymentRows));
    result.yearBalances = withYearStatus(yearBalances, [], []);
    return result;
  }

  const [chargeEntries, paymentRows, apartments] = await Promise.all([
    loadChargeEntries(hoa.id),
    loadPaymentRows(hoa.id),
    prisma.apartment.findMany({
      where: { homeownersAssociationId: hoa.id },
      select: { id: true, externalOwnerId: true, externalApartmentId: true },
    }),
  ]);
  const paymentEntries = toPaymentEntries(paymentRows);
  const yearBalances = await loadYearBalances(toBalanceSources(paymentRows));
  const apartmentMap = new Map(
    apartments.map((apartment) => [apartmentKey(apartment), apartment.id])
  );

  runValidators(chargeEntries, paymentEntries, result);
  await validateCrossYearBalances(
    prisma,
    apartmentMap,
    paymentEntries,
    result.warnings
  );
  await validateBalanceDrift(
    prisma,
    apartmentMap,
    paymentEntries,
    result.warnings
  );
  result.yearBalances = withYearStatus(
    yearBalances,
    result.errors,
    result.warnings
  );

  return result;
}

export interface ValidateDatabaseOptions {
  skipFullValidation?: boolean;
}

export type DatabaseValidationResult = BatchImportResult & {
  fullValidationSkipped: boolean;
};

/**
 * Runs the import checks against stored data without modifying anything. With
 * `skipFullValidation`, only the year balances are loaded and checked.
 */
export async function validateDatabase({
  skipFullValidation = false,
}: ValidateDatabaseOptions = {}): Promise<DatabaseValidationResult> {
  const hoas = await prisma.homeownersAssociation.findMany({
    select: { id: true, externalId: true, name: true },
    orderBy: { externalId: 'asc' },
  });

  const results = await mapWithConcurrency(
    hoas,
    IMPORT_HOA_CONCURRENCY,
    (hoa) => validateHoa(hoa, skipFullValidation)
  );

  return {
    success: results.every(({ errors }) => errors.length === 0),
    results,
    errors: [],
    fullValidationSkipped: skipFullValidation,
  };
}
