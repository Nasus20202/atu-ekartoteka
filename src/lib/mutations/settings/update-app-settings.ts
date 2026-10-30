import { prisma } from '@/lib/database/prisma';
import { getAppSettings } from '@/lib/queries/settings/get-app-settings';
import type { AppSettingsValues } from '@/lib/settings/registry';

/** Upserts only settings whose value changed, in one transaction; returns all settings. */
export async function updateAppSettings(values: Partial<AppSettingsValues>) {
  const current = await getAppSettings();
  const changed = Object.entries(values).filter(
    ([key, value]) => current[key as keyof AppSettingsValues] !== value
  );

  if (changed.length === 0) return current;

  await prisma.$transaction(
    changed.map(([key, value]) =>
      prisma.appSetting.upsert({
        where: { key },
        create: { key, value },
        update: { value },
      })
    )
  );

  return getAppSettings();
}
