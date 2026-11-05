import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import {
  APP_SETTINGS_NON_SETTING_COLUMNS,
  APP_SETTINGS_ROW_ID,
} from '@/lib/settings/constants';
import {
  type AppSettingsValues,
  getDefaultAppSettings,
} from '@/lib/settings/registry';

/** Uncached read; a missing row (never saved) yields the defaults. */
export async function readAppSettings(): Promise<AppSettingsValues> {
  const row = await prisma.appSettings.findUnique({
    where: { id: APP_SETTINGS_ROW_ID },
    omit: APP_SETTINGS_NON_SETTING_COLUMNS,
  });

  return row ?? getDefaultAppSettings();
}

/** Request-scoped: however many callers render in one request, one query runs. */
export const getAppSettings = cache(readAppSettings);
