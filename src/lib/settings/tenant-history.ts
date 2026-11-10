import { getTenantHistoryYearsBack } from '@/lib/queries/settings/app-settings';
import { getHistoryStartYear } from '@/lib/utils/history-window';
import { getRequestNow } from '@/lib/utils/request-now';

export async function getTenantHistoryStartYear(): Promise<number> {
  const [now, yearsBack] = await Promise.all([
    getRequestNow(),
    getTenantHistoryYearsBack(),
  ]);

  return getHistoryStartYear(now, yearsBack);
}
