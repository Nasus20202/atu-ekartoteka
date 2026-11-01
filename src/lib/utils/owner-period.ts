import { formatUtcDate } from '@/lib/utils';

const EMPTY_OWNER_PERIOD = 'Brak';

/** Owner period from ISO dates: "od 01.01.2020 do 31.01.2020", "od 01.02.2020" or "Brak". */
export function formatOwnerPeriod(
  validFrom: string | null,
  validTo: string | null
): string {
  const parts: string[] = [];
  if (validFrom) parts.push(`od ${formatUtcDate(new Date(validFrom))}`);
  if (validTo) parts.push(`do ${formatUtcDate(new Date(validTo))}`);
  return parts.length > 0 ? parts.join(' ') : EMPTY_OWNER_PERIOD;
}
