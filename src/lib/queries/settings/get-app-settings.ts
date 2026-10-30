import { cache } from 'react';

import { prisma } from '@/lib/database/prisma';
import {
  type AppSettingsValues,
  resolveAppSettings,
} from '@/lib/settings/registry';

export async function getAppSettings(): Promise<AppSettingsValues> {
  const rows = await prisma.appSetting.findMany({
    select: { key: true, value: true },
  });

  return resolveAppSettings(rows);
}

export const getAppSettingsCached = cache(getAppSettings);
