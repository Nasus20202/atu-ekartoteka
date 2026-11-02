import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PRESENCE_EXIT_MS, usePresence } from '@/hooks/use-presence';

describe('usePresence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stays unmounted when initially hidden', () => {
    const { result } = renderHook(() => usePresence(false));

    expect(result.current).toEqual({ isMounted: false, state: 'open' });
  });

  it('mounts with an open state when initially visible', () => {
    const { result } = renderHook(() => usePresence(true));

    expect(result.current).toEqual({ isMounted: true, state: 'open' });
  });

  it('mounts immediately when shown after being hidden', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePresence(visible),
      { initialProps: { visible: false } }
    );

    rerender({ visible: true });

    expect(result.current).toEqual({ isMounted: true, state: 'open' });
  });

  it('keeps the element mounted in the closed state while it animates out', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePresence(visible),
      { initialProps: { visible: true } }
    );

    rerender({ visible: false });

    expect(result.current).toEqual({ isMounted: true, state: 'closed' });
  });

  it('unmounts after the exit animation duration', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePresence(visible),
      { initialProps: { visible: true } }
    );

    rerender({ visible: false });

    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_MS);
    });

    expect(result.current).toEqual({ isMounted: false, state: 'open' });
  });

  it('cancels the exit when shown again before it finishes', () => {
    const { result, rerender } = renderHook(
      ({ visible }) => usePresence(visible),
      { initialProps: { visible: true } }
    );

    rerender({ visible: false });
    rerender({ visible: true });

    act(() => {
      vi.advanceTimersByTime(PRESENCE_EXIT_MS);
    });

    expect(result.current).toEqual({ isMounted: true, state: 'open' });
  });
});
