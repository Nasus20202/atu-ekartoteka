import {
  bulkAssignAccountsAction,
  bulkCreateAccountsAction,
} from '@/actions/users/bulk-users';

export type BulkMode = 'create' | 'assign';

export interface BulkOperationResult {
  created?: number;
  assigned?: number;
  skipped: number;
  errors: number;
}

type RequestResult<T> =
  { data: T; error?: never } | { data?: never; error: string };

const BULK_FAILED = {
  create: 'Wystąpił błąd podczas tworzenia kont',
  assign: 'Wystąpił błąd podczas przypisywania kont',
} as const;

export async function runBulkOperation(
  mode: BulkMode,
  apartmentIds: string[]
): Promise<RequestResult<BulkOperationResult>> {
  try {
    const result =
      mode === 'create'
        ? await bulkCreateAccountsAction({ apartmentIds })
        : await bulkAssignAccountsAction({ apartmentIds });

    return result.ok
      ? { data: result.data }
      : { error: result.error || BULK_FAILED[mode] };
  } catch {
    return { error: BULK_FAILED[mode] };
  }
}

export function formatBulkResult(
  mode: BulkMode,
  result: BulkOperationResult
): string {
  const summary =
    mode === 'create'
      ? `Utworzono ${result.created ?? 0} kont.`
      : `Przypisano ${result.assigned ?? 0} mieszkań.`;
  const errors = result.errors > 0 ? ` Błędy: ${result.errors}.` : '';
  return `${summary} Pominięto ${result.skipped}.${errors}`;
}
