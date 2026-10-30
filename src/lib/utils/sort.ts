export type SortDirection = 'asc' | 'desc';

export interface SortState<K extends string> {
  key: K;
  direction: SortDirection;
}

export type ApartmentSortKey = 'label' | 'owner' | 'share' | 'status';
export type UserSortKey = 'name' | 'email' | 'status' | 'apartments';

export function toggleSort<K extends string>(
  current: SortState<K> | null,
  key: K
): SortState<K> {
  return current?.key === key
    ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
    : { key, direction: 'asc' };
}
