import { prisma } from '@/lib/database/prisma';
import { validateBalanceDrift } from '@/lib/import/balance-drift-validation';
import { IMPORT_HOA_CONCURRENCY } from '@/lib/import/constants';
import { validateCrossYearBalances } from '@/lib/import/cross-year-validation';
import {
  loadChargeEntries,
  loadPaymentEntries,
} from '@/lib/import/load-stored-entries';
import { loadYearBalances } from '@/lib/import/load-year-balances';
import type { BatchImportResult, HOAImportResult } from '@/lib/import/types';
import { createEmptyStats, mapWithConcurrency } from '@/lib/import/utils';
import { runValidators } from '@/lib/import/validate-hoa-files';
import { paymentErrorYears } from '@/lib/import/validators';
import { withYearStatus } from '@/lib/import/year-status';

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
    const yearBalances = await loadYearBalances(hoa.id);
    result.yearBalances = withYearStatus(yearBalances, [], [], []);
    return result;
  }

  const [chargeEntries, paymentEntries, apartments, yearBalances] =
    await Promise.all([
      loadChargeEntries(hoa.id),
      loadPaymentEntries(hoa.id),
      prisma.apartment.findMany({
        where: { homeownersAssociationId: hoa.id },
        select: { id: true, externalOwnerId: true, externalApartmentId: true },
      }),
      loadYearBalances(hoa.id),
    ]);
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
  result.yearErrors = paymentErrorYears(paymentEntries);
  result.yearBalances = withYearStatus(
    yearBalances,
    result.errors,
    result.yearErrors,
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
