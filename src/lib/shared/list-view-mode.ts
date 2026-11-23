export enum ListViewMode {
  CARDS = 'cards',
  TABLE = 'table',
}

const VALID_MODES: readonly string[] = Object.values(ListViewMode);

export const LIST_VIEW_STORAGE_KEYS = {
  apartments: 'atu:list-view:apartments',
  users: 'atu:list-view:users',
} as const;

export const LIST_VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function parseListViewMode(value: string | null | undefined) {
  return value && VALID_MODES.includes(value)
    ? (value as ListViewMode)
    : ListViewMode.CARDS;
}

/** The storage key as a cookie name (cookie names cannot contain `:`). */
export function listViewCookieName(storageKey: string): string {
  return storageKey.replace(/[^a-z0-9-]/gi, '-');
}
