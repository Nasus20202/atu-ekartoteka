import type { Active, Over } from '@dnd-kit/core';
import { describe, expect, it } from 'vitest';

import {
  buildHoaAnnouncements,
  HOA_REORDER_INSTRUCTIONS,
} from '@/components/apartments/hoa-reorder-announcements';

const names: Record<string, string> = { a: 'Alfa', b: 'Beta', c: 'Gamma' };
const announcements = buildHoaAnnouncements(['a', 'b', 'c'], (id) => names[id]);
const active = (id: string) => ({ id }) as Active;
const over = (id: string) => ({ id }) as Over;

describe('buildHoaAnnouncements', () => {
  it('announces the lifted HOA and its position', () => {
    expect(announcements.onDragStart?.({ active: active('b') })).toBe(
      'Podniesiono wspólnotę Beta, pozycja 2 z 3.'
    );
  });

  it('announces the position the HOA is over', () => {
    expect(
      announcements.onDragOver?.({ active: active('a'), over: over('c') })
    ).toBe('Wspólnota Alfa jest nad pozycją 3 z 3.');
  });

  it('says nothing when the HOA is not over a row', () => {
    expect(
      announcements.onDragOver?.({ active: active('a'), over: null })
    ).toBeUndefined();
  });

  it('announces where the HOA was dropped', () => {
    expect(
      announcements.onDragEnd?.({ active: active('a'), over: over('c') })
    ).toBe('Upuszczono wspólnotę Alfa, pozycja 3 z 3.');
  });

  it('announces a drop outside the rows at the original position', () => {
    expect(announcements.onDragEnd?.({ active: active('b'), over: null })).toBe(
      'Upuszczono wspólnotę Beta, pozycja 2 z 3.'
    );
  });

  it('announces a cancelled move', () => {
    expect(
      announcements.onDragCancel?.({ active: active('c'), over: null })
    ).toBe('Anulowano przenoszenie wspólnoty Gamma.');
  });

  it('gives keyboard instructions in Polish', () => {
    expect(HOA_REORDER_INSTRUCTIONS).toMatch(/spację/);
    expect(HOA_REORDER_INSTRUCTIONS).toMatch(/Escape/);
  });
});
