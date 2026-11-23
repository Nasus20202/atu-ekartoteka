import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useHeaderStuck } from '@/components/layout/use-header-stuck';

type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

const SENTINEL_TOP_AT_REST = 200;

let callback: ObserverCallback;
const disconnect = vi.fn();

function createSentinel() {
  const sentinel = document.createElement('div');
  let top = SENTINEL_TOP_AT_REST;
  Object.defineProperty(sentinel, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top }) as unknown as DOMRect,
  });
  return {
    sentinel,
    setTop: (value: number) => {
      top = value;
    },
  };
}

function renderWithSentinel() {
  const { sentinel } = createSentinel();
  return renderHook(() => {
    const value = useHeaderStuck();
    value.sentinelRef.current = sentinel;
    return value;
  });
}

describe('useHeaderStuck', () => {
  beforeEach(() => {
    disconnect.mockClear();
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: ObserverCallback) {
          callback = cb;
        }
        observe = vi.fn();
        disconnect = disconnect;
      }
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('is not stuck at rest', () => {
    const { result } = renderWithSentinel();

    expect(result.current.isStuck).toBe(false);
  });

  it('becomes stuck once the sentinel scrolls under the navbar', () => {
    const { result } = renderWithSentinel();

    act(() =>
      callback([
        {
          isIntersecting: false,
          boundingClientRect: { top: -20 } as DOMRectReadOnly,
        },
      ])
    );

    expect(result.current.isStuck).toBe(true);
  });

  it('is released when the sentinel returns into view', () => {
    const { result } = renderWithSentinel();

    act(() =>
      callback([
        {
          isIntersecting: false,
          boundingClientRect: { top: -20 } as DOMRectReadOnly,
        },
      ])
    );
    act(() =>
      callback([
        {
          isIntersecting: true,
          boundingClientRect: { top: 200 } as DOMRectReadOnly,
        },
      ])
    );

    expect(result.current.isStuck).toBe(false);
  });

  it('follows the sentinel on scroll, without waiting for the observer', () => {
    const { sentinel, setTop } = createSentinel();
    const { result } = renderHook(() => {
      const value = useHeaderStuck();
      value.sentinelRef.current = sentinel;
      return value;
    });

    setTop(-20);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.isStuck).toBe(true);

    setTop(SENTINEL_TOP_AT_REST);
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    expect(result.current.isStuck).toBe(false);
  });

  it('disconnects the observer and listeners on unmount', () => {
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderWithSentinel();

    unmount();

    expect(disconnect).toHaveBeenCalled();
    expect(removeEventListener).toHaveBeenCalledWith(
      'scroll',
      expect.any(Function)
    );
    removeEventListener.mockRestore();
  });

  it('stays not stuck without IntersectionObserver support', () => {
    vi.unstubAllGlobals();
    vi.stubGlobal('IntersectionObserver', undefined);

    const { result } = renderWithSentinel();

    expect(result.current.isStuck).toBe(false);
  });

  it('measures the resting height and keeps it while stuck', () => {
    vi.useFakeTimers();
    let resize: () => void = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          resize = cb;
        }
        observe = vi.fn();
        disconnect = vi.fn();
      }
    );
    const content = document.createElement('div');
    let height = 96;
    Object.defineProperty(content, 'offsetHeight', { get: () => height });

    const { sentinel } = createSentinel();
    const { result } = renderHook(() => {
      const value = useHeaderStuck();
      value.sentinelRef.current = sentinel;
      value.contentRef.current = content;
      return value;
    });
    expect(result.current.restingHeight).toBe(96);

    act(() =>
      callback([
        {
          isIntersecting: false,
          boundingClientRect: { top: -20 } as DOMRectReadOnly,
        },
      ])
    );
    height = 56;
    act(() => {
      resize();
      vi.runAllTimers();
    });

    expect(result.current.restingHeight).toBe(96);
    vi.useRealTimers();
  });
});
