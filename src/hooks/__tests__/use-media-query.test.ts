import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMediaQuery } from '@/hooks/use-media-query';

const QUERY = '(min-width: 640px)';

type Listener = (event: { matches: boolean }) => void;

let originalMatchMedia: typeof window.matchMedia;

/** A media query list that the test can change and that reports its listeners. */
function stubMediaQuery(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<Listener>();
  const list = {
    get matches() {
      return matches;
    },
    addEventListener: vi.fn((_type: string, listener: Listener) =>
      listeners.add(listener)
    ),
    removeEventListener: vi.fn((_type: string, listener: Listener) =>
      listeners.delete(listener)
    ),
  };
  const matchMedia = vi.fn().mockReturnValue(list);
  window.matchMedia = matchMedia;

  return {
    matchMedia,
    change(nextMatches: boolean) {
      matches = nextMatches;
      for (const listener of listeners) listener({ matches });
    },
    listenerCount: () => listeners.size,
  };
}

describe('useMediaQuery', () => {
  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  it('reports whether the viewport matches the query', () => {
    const media = stubMediaQuery(true);

    const { result } = renderHook(() => useMediaQuery(QUERY));

    expect(result.current).toBe(true);
    expect(media.matchMedia).toHaveBeenCalledWith(QUERY);
  });

  it('follows the viewport when it changes size', () => {
    const media = stubMediaQuery(false);

    const { result } = renderHook(() => useMediaQuery(QUERY));
    expect(result.current).toBe(false);

    act(() => media.change(true));
    expect(result.current).toBe(true);
  });

  it('stops listening after unmount', () => {
    const media = stubMediaQuery(false);

    const { unmount } = renderHook(() => useMediaQuery(QUERY));
    expect(media.listenerCount()).toBe(1);

    unmount();
    expect(media.listenerCount()).toBe(0);
  });
});
