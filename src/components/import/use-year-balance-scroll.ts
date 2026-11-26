'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const EDGE_TOLERANCE_PX = 2;
export const YEAR_START_ATTRIBUTE = 'data-year-start';

type Direction = 'previous' | 'next';

/**
 * Scrolls a wide year table one year at a time, keeping its first column in
 * view. The table starts scrolled to the right, on the newest year.
 */
export function useYearBalanceScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= EDGE_TOLERANCE_PX);
    setAtEnd(
      el.scrollLeft + el.clientWidth >= el.scrollWidth - EDGE_TOLERANCE_PX
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Years rise to the right, so open on the newest one
    el.scrollLeft = el.scrollWidth;
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [update]);

  const scrollByYear = useCallback((direction: Direction) => {
    const el = ref.current;
    if (!el) return;
    // The border sits between the box edge and the scrolled content
    const left = el.getBoundingClientRect().left + el.clientLeft;
    const stickyWidth =
      el.querySelector('thead th')?.getBoundingClientRect().width ?? 0;
    const starts = [...el.querySelectorAll(`[${YEAR_START_ATTRIBUTE}]`)].map(
      (cell) =>
        cell.getBoundingClientRect().left - left + el.scrollLeft - stickyWidth
    );
    const maxScroll = el.scrollWidth - el.clientWidth;
    // Past the last (or before the first) year start, go to the edge itself
    const target =
      direction === 'next'
        ? (starts.find((start) => start > el.scrollLeft + EDGE_TOLERANCE_PX) ??
          (el.scrollLeft < maxScroll - EDGE_TOLERANCE_PX
            ? maxScroll
            : undefined))
        : (starts.findLast(
            (start) => start < el.scrollLeft - EDGE_TOLERANCE_PX
          ) ?? (el.scrollLeft > EDGE_TOLERANCE_PX ? 0 : undefined));
    if (target === undefined) return;

    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    el.scrollTo({
      left: Math.max(0, Math.round(target)),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  return { ref, atStart, atEnd, onScroll: update, scrollByYear } as const;
}
