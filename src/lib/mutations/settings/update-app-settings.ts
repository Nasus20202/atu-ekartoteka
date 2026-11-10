import { prisma } from '@/lib/database/prisma';
import { APP_SETTINGS_ROW_ID } from '@/lib/settings/constants';
import {
  APP_SETTINGS,
  type AppSettingKey,
  type AppSettingsValues,
} from '@/lib/settings/registry';

type SettingsSelect = Partial<Record<AppSettingKey, true>>;

/**
 * Upserts the single settings row when a value changed; returns the stored
 * values of the updated keys only. Reads uncached and only those columns, so a
 * stale request-scoped value is never compared and no other setting is loaded.
 */
export async function updateAppSettings(
  values: Partial<AppSettingsValues>
): Promise<Partial<AppSettingsValues>> {
  const keys = Object.keys(values) as AppSettingKey[];
  const select = Object.fromEntries(keys.map((key) => [key, true]));

  const row = (await prisma.appSettings.findUnique({
    where: { id: APP_SETTINGS_ROW_ID },
    select: select as SettingsSelect,
  })) as Partial<AppSettingsValues> | null;

  const current = Object.fromEntries(
    keys.map((key) => [key, row ? row[key] : APP_SETTINGS[key].defaultValue])
  ) as Partial<AppSettingsValues>;

  if (keys.every((key) => current[key] === values[key])) return current;

  return prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ROW_ID },
    create: { id: APP_SETTINGS_ROW_ID, ...values },
    update: values,
    select: select as SettingsSelect,
  });
}
