import { DEFAULT_TENANT_HISTORY_YEARS_BACK } from '@/lib/settings/constants';
import { parsePrivacyPolicy } from '@/lib/settings/parse-privacy-policy';
import type { ParseResult } from '@/lib/settings/parse-result';
import { parseYearsBack } from '@/lib/settings/parse-years-back';

interface SettingDefinition<T> {
  defaultValue: T;
  parse: (value: unknown) => ParseResult<T>;
}

// Each setting is also a typed AppSettings column; adding one needs a migration
// (ADD COLUMN with CHECK) and an entry here.
export const APP_SETTINGS = {
  tenantHistoryYearsBack: {
    defaultValue: DEFAULT_TENANT_HISTORY_YEARS_BACK,
    parse: parseYearsBack,
  },
  privacyPolicy: {
    defaultValue: null as string | null,
    parse: parsePrivacyPolicy,
  },
} satisfies Record<string, SettingDefinition<unknown>>;

export type AppSettingKey = keyof typeof APP_SETTINGS;
export type AppSettingsValues = {
  [K in AppSettingKey]: (typeof APP_SETTINGS)[K]['defaultValue'];
};

export type SettingsUpdateParse =
  | { ok: true; values: Partial<AppSettingsValues> }
  | { ok: false; message?: string };

function isSettingKey(key: string): key is AppSettingKey {
  return Object.hasOwn(APP_SETTINGS, key);
}

/** Validates a partial update: not empty, known keys, valid values. */
export function parseAppSettingsUpdate(body: unknown): SettingsUpdateParse {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return { ok: false };
  }

  const entries = Object.entries(body);
  if (entries.length === 0) return { ok: false };

  const values: Partial<Record<AppSettingKey, unknown>> = {};
  for (const [key, value] of entries) {
    if (!isSettingKey(key)) return { ok: false };
    const parsed = APP_SETTINGS[key].parse(value);
    if (!parsed.ok) return { ok: false, message: parsed.message };
    values[key] = parsed.value;
  }

  return { ok: true, values: values as Partial<AppSettingsValues> };
}
