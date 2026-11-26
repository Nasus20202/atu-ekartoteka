import { describe, expect, it } from 'vitest';

import {
  moveHoaId,
  parseHoaOrder,
  sortByHoaOrder,
} from '@/lib/hoa/rules/hoa-order';

const items = ['a', 'b', 'c', 'd'].map((id) => ({ id }));
const idsOf = (list: { id: string }[]) => list.map((item) => item.id);

describe('parseHoaOrder', () => {
  it('reads a stored list of ids', () => {
    expect(parseHoaOrder('["b","a"]')).toEqual(['b', 'a']);
  });

  it('returns an empty order for missing values', () => {
    expect(parseHoaOrder(null)).toEqual([]);
    expect(parseHoaOrder(undefined)).toEqual([]);
    expect(parseHoaOrder('')).toEqual([]);
  });

  it('returns an empty order for invalid JSON or a different shape', () => {
    expect(parseHoaOrder('{oops')).toEqual([]);
    expect(parseHoaOrder('{"a":1}')).toEqual([]);
    expect(parseHoaOrder('"a"')).toEqual([]);
  });

  it('drops entries that are not ids', () => {
    expect(parseHoaOrder('["a",1,null,"b"]')).toEqual(['a', 'b']);
  });
});

describe('sortByHoaOrder', () => {
  it('keeps the given order when nothing is stored', () => {
    expect(idsOf(sortByHoaOrder(items, []))).toEqual(['a', 'b', 'c', 'd']);
  });

  it('sorts by the stored order', () => {
    expect(idsOf(sortByHoaOrder(items, ['c', 'a', 'd', 'b']))).toEqual([
      'c',
      'a',
      'd',
      'b',
    ]);
  });

  it('puts items missing from the stored order at the end, in their order', () => {
    expect(idsOf(sortByHoaOrder(items, ['c', 'a']))).toEqual([
      'c',
      'a',
      'b',
      'd',
    ]);
  });

  it('ignores stored ids that no longer exist', () => {
    expect(idsOf(sortByHoaOrder(items, ['x', 'b', 'y', 'a']))).toEqual([
      'b',
      'a',
      'c',
      'd',
    ]);
  });

  it('does not change the input', () => {
    const input = [...items];
    sortByHoaOrder(input, ['d']);
    expect(input).toEqual(items);
  });
});

describe('moveHoaId', () => {
  const ids = ['a', 'b', 'c', 'd'];

  it('moves an id down', () => {
    expect(moveHoaId(ids, 0, 2)).toEqual(['b', 'c', 'a', 'd']);
  });

  it('moves an id up', () => {
    expect(moveHoaId(ids, 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });

  it('returns a copy when nothing moves', () => {
    const result = moveHoaId(ids, 1, 1);
    expect(result).toEqual(ids);
    expect(result).not.toBe(ids);
  });

  it('ignores positions outside the list', () => {
    expect(moveHoaId(ids, -1, 2)).toEqual(ids);
    expect(moveHoaId(ids, 1, 4)).toEqual(ids);
    expect(moveHoaId(ids, 4, 1)).toEqual(ids);
  });
});
