import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import { APP_SETTINGS_ROW_ID } from '@/lib/settings/constants';
import {
  APP_SETTINGS,
  type AppSettingKey,
  type AppSettingsValues,
} from '@/lib/settings/registry';

/**
 * Uncached read of one setting. Only that column is selected, so a large
 * setting is never loaded with a small one. A missing row (never saved)
 * yields the default.
 */
export async function readSetting<K extends AppSettingKey>(
  key: K
): Promise<AppSettingsValues[K]> {
  const row = (await prisma.appSettings.findUnique({
    where: { id: APP_SETTINGS_ROW_ID },
    select: { [key]: true },
  })) as Pick<AppSettingsValues, K> | null;

  return (
    row ? row[key] : APP_SETTINGS[key].defaultValue
  ) as AppSettingsValues[K];
}

// One reader per setting, each request-scoped: however many callers render in
// one request, one query runs. `cache` compares arguments by reference, so a
// reader takes none.
export const getTenantHistoryYearsBack = cache(() =>
  readSetting('tenantHistoryYearsBack')
);
export const getPrivacyPolicy = cache(() => readSetting('privacyPolicy'));
