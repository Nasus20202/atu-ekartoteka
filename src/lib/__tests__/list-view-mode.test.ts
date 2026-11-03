import { describe, expect, it } from 'vitest';

import {
  listViewCookieName,
  ListViewMode,
  parseListViewMode,
} from '@/lib/list-view-mode';

describe('list view mode', () => {
  it.each([
    ['table', ListViewMode.TABLE],
    ['cards', ListViewMode.CARDS],
    ['grid', ListViewMode.CARDS],
    ['', ListViewMode.CARDS],
    [null, ListViewMode.CARDS],
    [undefined, ListViewMode.CARDS],
  ])('parses %j as %s', (value, expected) => {
    expect(parseListViewMode(value)).toBe(expected);
  });

  it('turns a storage key into a valid cookie name', () => {
    expect(listViewCookieName('atu:list-view:users')).toBe(
      'atu-list-view-users'
    );
  });
});
