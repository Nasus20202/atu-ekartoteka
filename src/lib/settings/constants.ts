export const DEFAULT_TENANT_HISTORY_YEARS_BACK = 2;
export const MIN_TENANT_HISTORY_YEARS_BACK = 0;
export const MAX_TENANT_HISTORY_YEARS_BACK = 20;

/** Primary key of the only AppSettings row; the database rejects any other id. */
export const APP_SETTINGS_ROW_ID = 1;

/** Columns that are not settings; omitted so reads return only setting values. */
export const APP_SETTINGS_NON_SETTING_COLUMNS = {
  id: true,
  updatedAt: true,
} as const;
