import type {
  BatchImportResult,
  HOAImportResult,
} from '@/lib/import/types/import-result';

export const stats = (
  created: number,
  updated = 0,
  skipped = 0,
  deleted = 0
) => ({
  created,
  updated,
  skipped,
  deleted,
  total: created + updated + skipped + deleted,
});

export function hoa(overrides: Partial<HOAImportResult> = {}): HOAImportResult {
  return {
    hoaId: 'HOA1',
    apartments: stats(2, 1),
    charges: stats(5),
    notifications: stats(0, 0, 1),
    payments: stats(3),
    errors: [],
    warnings: [],
    ...overrides,
  };
}

export function batch(
  results: HOAImportResult[],
  errors: BatchImportResult['errors'] = []
): BatchImportResult {
  const success =
    errors.length === 0 &&
    results.every((result) => result.errors.length === 0);
  return { success, results, errors };
}
