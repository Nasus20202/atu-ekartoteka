import { describe, expect, it } from 'vitest';

import { splitRange } from '../seed-charges';

describe('splitRange', () => {
  it('splits the range into contiguous parts that cover every item once', () => {
    expect(splitRange(10, 4)).toEqual([
      [1, 3],
      [4, 6],
      [7, 9],
      [10, 10],
    ]);
  });

  it('splits evenly divisible totals into equal parts', () => {
    expect(splitRange(10000, 4)).toEqual([
      [1, 2500],
      [2501, 5000],
      [5001, 7500],
      [7501, 10000],
    ]);
  });

  it('never returns more parts than items', () => {
    expect(splitRange(2, 4)).toEqual([
      [1, 1],
      [2, 2],
    ]);
  });

  it('returns no parts for an empty range', () => {
    expect(splitRange(0, 4)).toEqual([]);
  });
});
