import { getAppSettings } from '@/lib/queries/settings/get-app-settings';
import { getHistoryStartYear } from '@/lib/utils/history-window';
import { getRequestNow } from '@/lib/utils/request-now';

export async function getTenantHistoryStartYear(): Promise<number> {
  const [now, { tenantHistoryYearsBack }] = await Promise.all([
    getRequestNow(),
    getAppSettings(),
  ]);

  return getHistoryStartYear(now, tenantHistoryYearsBack);
}
