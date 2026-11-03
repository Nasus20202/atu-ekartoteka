import { prisma } from '@/lib/database/prisma';
import {
  type AppSettingsValues,
  resolveAppSettings,
} from '@/lib/settings/registry';

const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedSettings {
  values: AppSettingsValues;
  expiresAt: number;
}

let cached: CachedSettings | null = null;

export async function getAppSettings(): Promise<AppSettingsValues> {
  const rows = await prisma.appSetting.findMany({
    select: { key: true, value: true },
  });

  return resolveAppSettings(rows);
}

/**
 * Settings are global, so every user of a replica shares one entry for a
 * bounded time. A save on this replica clears it at once; other replicas pick
 * the new value up when their entry expires.
 */
export async function getAppSettingsCached(): Promise<AppSettingsValues> {
  if (cached && cached.expiresAt > Date.now()) {
    return cached.values;
  }

  const values = await getAppSettings();
  cached = { values, expiresAt: Date.now() + SETTINGS_CACHE_TTL_MS };

  return values;
}

export function invalidateAppSettingsCache() {
  cached = null;
}
