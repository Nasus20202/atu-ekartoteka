import { cacheLife, cacheTag } from 'next/cache';

import { SETTINGS_CACHE, SETTINGS_CACHE_TAG } from '@/lib/cache/profiles';
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

/** Settings are global, so every user shares one entry per replica. */
export async function getAppSettingsCached(): Promise<AppSettingsValues> {
  'use cache';
  cacheLife(SETTINGS_CACHE);
  cacheTag(SETTINGS_CACHE_TAG);

  return getAppSettings();
}
