export const DEFAULT_TENANT_HISTORY_YEARS_BACK = 2;
export const MIN_TENANT_HISTORY_YEARS_BACK = 0;
export const MAX_TENANT_HISTORY_YEARS_BACK = 20;

export function parseYearsBack(value: unknown): number | null {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < MIN_TENANT_HISTORY_YEARS_BACK ||
    value > MAX_TENANT_HISTORY_YEARS_BACK
  ) {
    return null;
  }

  return value;
}
