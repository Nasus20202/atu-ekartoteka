import {
  MAX_TENANT_HISTORY_YEARS_BACK,
  MIN_TENANT_HISTORY_YEARS_BACK,
} from '@/lib/settings/constants';

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
