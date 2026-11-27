import { describe, expect, it } from 'vitest';

import {
  ALL_READINGS,
  toReadingsQuery,
} from '@/lib/settlements/rules/readings-query';

describe('toReadingsQuery', () => {
  it('lists everything, newest first, without parameters', () => {
    expect(toReadingsQuery()).toEqual(ALL_READINGS);
  });

  it('takes a known column and direction', () => {
    expect(toReadingsQuery('CW 01', 'startValue', 'desc')).toEqual({
      meter: 'CW 01',
      sort: { key: 'startValue', direction: 'desc' },
    });
  });

  it.each([
    ['settlementId', 'asc'],
    ['consumption', 'sideways'],
    ['consumption', undefined],
    [undefined, 'asc'],
  ])('ignores the order %s %s', (key, direction) => {
    expect(toReadingsQuery(undefined, key, direction)).toEqual(ALL_READINGS);
  });
});
