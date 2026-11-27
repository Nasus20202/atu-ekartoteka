import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useCalendarFocus } from '@/components/ui/use-calendar-focus';

const key = (name: string) =>
  ({ key: name, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

describe('useCalendarFocus', () => {
  it('moves by day, week and month', () => {
    const { result } = renderHook(() => useCalendarFocus('2026-01-31'));

    act(() => result.current.onKeyDown(key('PageDown')));
    expect(result.current.focused).toBe('2026-02-28');

    act(() => result.current.onKeyDown(key('ArrowDown')));
    expect(result.current.focused).toBe('2026-03-07');

    act(() => result.current.onKeyDown(key('ArrowLeft')));
    act(() => result.current.onKeyDown(key('PageUp')));
    expect(result.current.focused).toBe('2026-02-06');
  });

  it('leaves other keys alone', () => {
    const { result } = renderHook(() => useCalendarFocus('2026-01-31'));
    const event = key('Tab');

    act(() => result.current.onKeyDown(event));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(result.current.focused).toBe('2026-01-31');
  });
});
