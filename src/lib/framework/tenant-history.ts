import { getRequestNow } from '@/lib/framework/request-now';
import { getTenantHistoryYearsBack } from '@/lib/framework/rsc-cache';
import { getHistoryStartYear } from '@/lib/shared/utils/history-window';

export async function getTenantHistoryStartYear(): Promise<number> {
  const [now, yearsBack] = await Promise.all([
    getRequestNow(),
    getTenantHistoryYearsBack(),
  ]);

  return getHistoryStartYear(now, yearsBack);
}
