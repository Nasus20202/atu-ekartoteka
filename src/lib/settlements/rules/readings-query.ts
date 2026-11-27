import { isSortDirection, type SortState } from '@/lib/shared/utils/sort';

export const READING_SORT_KEYS = [
  'device',
  'serialNumber',
  'startDate',
  'startValue',
  'endDate',
  'endValue',
  'consumption',
] as const;

export type ReadingSortKey = (typeof READING_SORT_KEYS)[number];

/** How the table of readings is narrowed and ordered. */
export interface ReadingsQuery {
  /** Device of the only meter to list, or null for every meter */
  meter: string | null;
  sort: SortState<ReadingSortKey>;
}

export const DEFAULT_READING_SORT: SortState<ReadingSortKey> = {
  key: 'endDate',
  direction: 'desc',
};

export const ALL_READINGS: ReadingsQuery = {
  meter: null,
  sort: DEFAULT_READING_SORT,
};

const isSortKey = (value: string): value is ReadingSortKey =>
  (READING_SORT_KEYS as readonly string[]).includes(value);

/** Reads untrusted values; anything unknown falls back to the default order. */
export function toReadingsQuery(
  meter?: string,
  key?: string,
  direction?: string
): ReadingsQuery {
  return {
    meter: meter ?? null,
    sort:
      key && direction && isSortKey(key) && isSortDirection(direction)
        ? { key, direction }
        : DEFAULT_READING_SORT,
  };
}
