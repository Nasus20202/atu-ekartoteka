import { describe, expect, it } from 'vitest';

import {
  readParam,
  readSelection,
} from '@/components/settlements/settlement-search-params';
import { ALL_READINGS } from '@/lib/settlements/rules/readings-query';

describe('settlement search parameters', () => {
  it('reads single values only', () => {
    expect(readParam({ period: 'u1' }, 'period')).toBe('u1');
    expect(readParam({ period: ['u1', 'u2'] }, 'period')).toBeUndefined();
    expect(readParam({ period: '' }, 'period')).toBeUndefined();
  });

  it('reads the selected periods', () => {
    expect(readSelection({ period: 'u1', year: 'r1' })).toEqual({
      utilityId: 'u1',
      annualId: 'r1',
      readings: ALL_READINGS,
    });
  });

  it('reads the filter and the order of the readings', () => {
    expect(
      readSelection({
        meter: 'CW 12',
        readingSort: 'consumption',
        readingOrder: 'asc',
      }).readings
    ).toEqual({
      meter: 'CW 12',
      sort: { key: 'consumption', direction: 'asc' },
    });
  });
});
