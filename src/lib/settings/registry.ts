import {
  DEFAULT_TENANT_HISTORY_YEARS_BACK,
  parseYearsBack,
} from '@/lib/settings/constants';

interface SettingDefinition<T> {
  defaultValue: T;
  parse: (value: unknown) => T | null;
}

// Adding a setting here needs no DB migration; a missing row uses defaultValue
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

const SETTING_KEYS = Object.keys(APP_SETTINGS) as AppSettingKey[];

function isSettingKey(key: string): key is AppSettingKey {
  return Object.hasOwn(APP_SETTINGS, key);
}

/** Stored rows merged over defaults; invalid stored values fall back too. */
export function resolveAppSettings(
  rows: Array<{ key: string; value: unknown }>
): AppSettingsValues {
  const stored = new Map(rows.map(({ key, value }) => [key, value]));

  return Object.fromEntries(
    SETTING_KEYS.map((key) => {
      const { defaultValue, parse } = APP_SETTINGS[key];
      return [
        key,
        stored.has(key)
          ? (parse(stored.get(key)) ?? defaultValue)
          : defaultValue,
      ];
    })
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
