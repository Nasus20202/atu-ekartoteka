import {
  MAX_TENANT_HISTORY_YEARS_BACK,
  MIN_TENANT_HISTORY_YEARS_BACK,
} from '@/lib/settings/rules/constants';
import type { ParseResult } from '@/lib/settings/rules/parse-result';

export function parseYearsBack(value: unknown): ParseResult<number> {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < MIN_TENANT_HISTORY_YEARS_BACK ||
    value > MAX_TENANT_HISTORY_YEARS_BACK
  ) {
    return { ok: false };
  }

  return { ok: true, value };
}
