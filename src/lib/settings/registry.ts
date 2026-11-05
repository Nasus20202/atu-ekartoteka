import { DEFAULT_TENANT_HISTORY_YEARS_BACK } from '@/lib/settings/constants';
import { parseYearsBack } from '@/lib/settings/parse-years-back';

interface SettingDefinition<T> {
  defaultValue: T;
  parse: (value: unknown) => T | null;
}

// Each setting is also a typed AppSettings column; adding one needs a migration
// (ADD COLUMN with DEFAULT and CHECK) and an entry here.
export const APP_SETTINGS = {
  tenantHistoryYearsBack: {
    defaultValue: DEFAULT_TENANT_HISTORY_YEARS_BACK,
    parse: parseYearsBack,
  },
} satisfies Record<string, SettingDefinition<unknown>>;

export type AppSettingKey = keyof typeof APP_SETTINGS;
export type AppSettingsValues = {
  [K in AppSettingKey]: (typeof APP_SETTINGS)[K]['defaultValue'];
};

function isSettingKey(key: string): key is AppSettingKey {
  return Object.hasOwn(APP_SETTINGS, key);
}

export function getDefaultAppSettings(): AppSettingsValues {
  return Object.fromEntries(
    Object.entries(APP_SETTINGS).map(([key, { defaultValue }]) => [
      key,
      defaultValue,
    ])
  ) as AppSettingsValues;
}

/** Validates a partial update; null when empty, unknown keys or invalid values. */
export function parseAppSettingsUpdate(
  body: unknown
): Partial<AppSettingsValues> | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return null;
  }

  const entries = Object.entries(body);
  if (entries.length === 0) return null;

  const update: Partial<Record<AppSettingKey, unknown>> = {};
  for (const [key, value] of entries) {
    if (!isSettingKey(key)) return null;
    const parsed = APP_SETTINGS[key].parse(value);
    if (parsed === null) return null;
    update[key] = parsed;
  }

  return update as Partial<AppSettingsValues>;
}
