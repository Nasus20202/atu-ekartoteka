import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  useYearBalanceScroll,
  YEAR_START_ATTRIBUTE,
} from '@/components/import/use-year-balance-scroll';

const STICKY_WIDTH = 100;
const VIEWPORT_WIDTH = 500;
const CONTENT_WIDTH = 900;
const WIDE_CONTENT_WIDTH = 1000;
const YEAR_LEFTS = [STICKY_WIDTH, 300, 500];

const scrollTo = vi.fn();
const originalMatchMedia = window.matchMedia;

function define(element: Element, name: string, value: unknown) {
  Object.defineProperty(element, name, { value, configurable: true });
}

function rect(left: number, width = 0) {
  return new DOMRect(left, 0, width, 0);
}

/** A scroller like the one in the grid, with its geometry and scroll position. */
function scroller(scrollLeft: number, contentWidth = CONTENT_WIDTH) {
  const el = document.createElement('div');
  el.innerHTML = `<table><thead><tr><th>Wspólnota</th>${YEAR_LEFTS.map(
    (_, i) => `<th ${YEAR_START_ATTRIBUTE}="${2024 + i}"></th>`
  ).join('')}</tr></thead></table>`;
  define(el, 'clientWidth', VIEWPORT_WIDTH);
  define(el, 'scrollWidth', contentWidth);
  define(el, 'scrollLeft', scrollLeft);
  define(el, 'getBoundingClientRect', () => rect(0, VIEWPORT_WIDTH));
  define(el.querySelector('thead th')!, 'getBoundingClientRect', () =>
    rect(0, STICKY_WIDTH)
  );
  el.querySelectorAll(`[${YEAR_START_ATTRIBUTE}]`).forEach((cell, i) =>
    define(cell, 'getBoundingClientRect', () =>
      rect(YEAR_LEFTS[i] - scrollLeft, 200)
    )
  );
  return el;
}

function setup(scrollLeft = 0, contentWidth = CONTENT_WIDTH) {
  const view = renderHook(() => useYearBalanceScroll());
  view.result.current.ref.current = scroller(scrollLeft, contentWidth);
  act(() => view.result.current.onScroll());
  return view;
}

describe('useYearBalanceScroll', () => {
  beforeEach(() => {
    scrollTo.mockReset();
    Element.prototype.scrollTo =
      scrollTo as unknown as typeof Element.prototype.scrollTo;
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
    }) as unknown as typeof window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('reports the start of the table', () => {
    const { result } = setup(0);

    expect(result.current.atStart).toBe(true);
    expect(result.current.atEnd).toBe(false);
  });

  it('reports the middle of the table', () => {
    const { result } = setup(200);

    expect(result.current.atStart).toBe(false);
    expect(result.current.atEnd).toBe(false);
  });

  it('reports the end of the table', () => {
    const { result } = setup(CONTENT_WIDTH - VIEWPORT_WIDTH);

    expect(result.current.atStart).toBe(false);
    expect(result.current.atEnd).toBe(true);
  });

  it('scrolls to the next year start, leaving the first column visible', () => {
    const { result } = setup(0);

    act(() => result.current.scrollByYear('next'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('scrolls to the previous year start', () => {
    const { result } = setup(400);

    act(() => result.current.scrollByYear('previous'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'smooth' });
  });

  it('does nothing when there is no year in that direction', () => {
    const atStart = setup(0);
    act(() => atStart.result.current.scrollByYear('previous'));

    const atEnd = setup(400);
    act(() => atEnd.result.current.scrollByYear('next'));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('goes to the right edge when no year starts after the position', () => {
    const { result } = setup(400, WIDE_CONTENT_WIDTH);

    act(() => result.current.scrollByYear('next'));

    expect(scrollTo).toHaveBeenCalledWith({
      left: WIDE_CONTENT_WIDTH - VIEWPORT_WIDTH,
      behavior: 'smooth',
    });
  });

  it('goes to the left edge when no year starts before the position', () => {
    const { result } = setup(100);

    act(() => result.current.scrollByYear('previous'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 0, behavior: 'smooth' });
  });

  it('does not animate for users who prefer reduced motion', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
    }) as unknown as typeof window.matchMedia;
    const { result } = setup(0);

    act(() => result.current.scrollByYear('next'));

    expect(scrollTo).toHaveBeenCalledWith({ left: 200, behavior: 'auto' });
  });

  it('does nothing before the table is attached', () => {
    const { result } = renderHook(() => useYearBalanceScroll());

    act(() => {
      result.current.onScroll();
      result.current.scrollByYear('next');
    });

    expect(scrollTo).not.toHaveBeenCalled();
    expect(result.current.atStart).toBe(true);
  });
});
