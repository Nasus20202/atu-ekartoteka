import { prisma } from '@/lib/database/prisma';
import { readAppSettings } from '@/lib/queries/settings/get-app-settings';
import { APP_SETTINGS_ROW_ID } from '@/lib/settings/constants';
import type { AppSettingsValues } from '@/lib/settings/registry';

/**
 * Upserts the single settings row when a value changed; returns the stored
 * settings. Reads uncached so a stale request-scoped value is never compared.
 */
export async function updateAppSettings(
  values: Partial<AppSettingsValues>
): Promise<AppSettingsValues> {
  const current = await readAppSettings();
  const changed = Object.entries(values).some(
    ([key, value]) => current[key as keyof AppSettingsValues] !== value
  );

  if (!changed) return current;

  return prisma.appSettings.upsert({
    where: { id: APP_SETTINGS_ROW_ID },
    create: { id: APP_SETTINGS_ROW_ID, ...values },
    update: values,
    select: { tenantHistoryYearsBack: true },
  });
}
