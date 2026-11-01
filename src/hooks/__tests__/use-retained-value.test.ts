import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useRetainedValue } from '@/hooks/use-retained-value';

describe('useRetainedValue', () => {
  it('returns the current value', () => {
    const { result } = renderHook(({ value }) => useRetainedValue(value), {
      initialProps: { value: 'first' as string | null },
    });

    expect(result.current).toBe('first');
  });

  it('keeps the last value once it is cleared', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useRetainedValue(value),
      { initialProps: { value: 'first' as string | null } }
    );

    rerender({ value: null });

    expect(result.current).toBe('first');
  });

  it('follows a new value after it was cleared', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useRetainedValue(value),
      { initialProps: { value: 'first' as string | null } }
    );

    rerender({ value: null });
    rerender({ value: 'second' });

    expect(result.current).toBe('second');
  });

  it('returns null when no value was ever set', () => {
    const { result } = renderHook(() => useRetainedValue<string>(null));

    expect(result.current).toBeNull();
  });
});
