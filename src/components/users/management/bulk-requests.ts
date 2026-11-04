import {
  bulkAssignAccountsAction,
  bulkCreateAccountsAction,
} from '@/actions/bulk-users';
import type { HoaGroup } from '@/components/users/management/hoa-card';

export type BulkMode = 'create' | 'assign';

export interface BulkOperationResult {
  created?: number;
  assigned?: number;
  skipped: number;
  errors: number;
}

type RequestResult<T> =
  { data: T; error?: never } | { data?: never; error: string };

const LOAD_APARTMENTS_FAILED = 'Nie udało się pobrać listy mieszkań';

const BULK_FAILED = {
  create: 'Wystąpił błąd podczas tworzenia kont',
  assign: 'Wystąpił błąd podczas przypisywania kont',
} as const;

async function requestJson<T>(
  url: string,
  fallbackError: string
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return response.ok ? { data } : { error: data.error || fallbackError };
  } catch {
    return { error: fallbackError };
  }
}

export interface UnassignedHoasPage {
  hoas: HoaGroup[];
  page: number;
  totalPages: number;
}

export async function fetchUnassignedHoas(
  mode: BulkMode,
  page = 1
): Promise<RequestResult<UnassignedHoasPage>> {
  const modeParam = mode === 'assign' ? 'assignable' : 'creatable';
  const result = await requestJson<{
    hoas: HoaGroup[];
    pagination: { page: number; totalPages: number };
  }>(
    `/api/admin/unassigned-apartments?mode=${modeParam}&page=${page}`,
    LOAD_APARTMENTS_FAILED
  );
  return result.error === undefined
    ? {
        data: {
          hoas: result.data.hoas,
          page: result.data.pagination.page,
          totalPages: result.data.pagination.totalPages,
        },
      }
    : { error: result.error };
}

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
