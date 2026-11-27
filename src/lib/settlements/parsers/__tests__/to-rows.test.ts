import { describe, expect, it } from 'vitest';

import { toRows } from '@/lib/settlements/parsers/to-rows';
import type { PdfItem } from '@/lib/settlements/types/pdf';

const item = (text: string, x: number, y: number, width = 10): PdfItem => ({
  text,
  x,
  y,
  width,
  height: 10,
});

const texts = (items: PdfItem[]) =>
  toRows([{ number: 1, items }]).map((r) => r.text);

describe('toRows', () => {
  it('orders rows from the top and items from the left, whatever the file order', () => {
    expect(
      texts([item('d', 20, 30), item('b', 20, 10), item('a', 0, 10)])
    ).toEqual(['a b', 'd']);
  });

  it('joins baselines that differ slightly into one row', () => {
    expect(
      texts([item('b', 20, 102.8), item('a', 0, 100), item('c', 0, 108.4)])
    ).toEqual(['a b', 'c']);
  });

  it('joins touching items into one word', () => {
    expect(texts([item('Na', 0, 10), item('zwa', 10.5, 10)])).toEqual([
      'Nazwa',
    ]);
  });

  it('keeps the left edge and the page of a row', () => {
    const rows = toRows([{ number: 3, items: [item('a', 148, 10)] }]);

    expect(rows).toEqual([{ page: 3, x: 148, text: 'a' }]);
  });
});
