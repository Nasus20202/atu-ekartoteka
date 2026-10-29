import type { HoaGroup } from '@/app/admin/users/management/hoa-card';

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

const BULK_OPERATIONS = {
  create: {
    url: '/api/admin/users/bulk-create',
    failed: 'Wystąpił błąd podczas tworzenia kont',
  },
  assign: {
    url: '/api/admin/users/bulk-assign',
    failed: 'Wystąpił błąd podczas przypisywania kont',
  },
} as const;

async function requestJson<T>(
  url: string,
  fallbackError: string,
  init?: RequestInit
): Promise<RequestResult<T>> {
  try {
    const response = await fetch(url, init);
    const data = await response.json();
    return response.ok ? { data } : { error: data.error || fallbackError };
  } catch {
    return { error: fallbackError };
  }
}

export async function fetchUnassignedHoas(
  mode: BulkMode
): Promise<RequestResult<HoaGroup[]>> {
  const modeParam = mode === 'assign' ? 'assignable' : 'creatable';
  const result = await requestJson<{ hoas: HoaGroup[] }>(
    `/api/admin/unassigned-apartments?mode=${modeParam}`,
    LOAD_APARTMENTS_FAILED
  );
  return result.error === undefined
    ? { data: result.data.hoas }
    : { error: result.error };
}

export function runBulkOperation(
  mode: BulkMode,
  apartmentIds: string[]
): Promise<RequestResult<BulkOperationResult>> {
  const { url, failed } = BULK_OPERATIONS[mode];
  return requestJson<BulkOperationResult>(url, failed, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apartmentIds }),
  });
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
