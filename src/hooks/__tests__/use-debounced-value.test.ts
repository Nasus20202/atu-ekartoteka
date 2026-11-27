import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebouncedValue } from '@/hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('follows the value only once it stops changing', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 100),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'ab' });
    act(() => vi.advanceTimersByTime(60));
    rerender({ value: 'abc' });
    act(() => vi.advanceTimersByTime(60));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(40));
    expect(result.current).toBe('abc');
  });
});
