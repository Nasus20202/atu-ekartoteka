import { vi } from 'vitest';

const MIN_WIDTH_PATTERN = /\(min-width: (\d+)px\)/;

/**
 * Makes the `min-width` media queries of the stats views match a viewport of
 * this width. Other queries do not match.
 */
export function setViewportWidth(width: number) {
  const matchMedia = vi.fn(
    (query: string) =>
      ({
        matches: matchesWidth(query, width),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList
  );
  window.matchMedia = matchMedia;
}

function matchesWidth(query: string, width: number): boolean {
  const minWidth = MIN_WIDTH_PATTERN.exec(query);
  return minWidth ? width >= Number(minWidth[1]) : false;
}

export const DESKTOP_WIDTH = 1280;
export const PHONE_WIDTH = 390;
