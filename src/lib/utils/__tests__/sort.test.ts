import { describe, expect, it } from 'vitest';

import { type SortState, toggleSort } from '@/lib/utils/sort';

describe('toggleSort', () => {
  it('starts ascending when nothing is sorted', () => {
    expect(toggleSort(null, 'name')).toEqual({ key: 'name', direction: 'asc' });
  });

  it('starts ascending when another column is sorted', () => {
    const current: SortState<string> = { key: 'email', direction: 'desc' };

    expect(toggleSort(current, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });

  it('flips the direction of the active column', () => {
    expect(toggleSort({ key: 'name', direction: 'asc' }, 'name')).toEqual({
      key: 'name',
      direction: 'desc',
    });
    expect(toggleSort({ key: 'name', direction: 'desc' }, 'name')).toEqual({
      key: 'name',
      direction: 'asc',
    });
  });
});
