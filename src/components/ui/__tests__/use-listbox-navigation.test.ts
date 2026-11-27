import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useListboxNavigation } from '@/components/ui/use-listbox-navigation';

const OPTIONS = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

const key = (name: string) =>
  ({ key: name, preventDefault: vi.fn() }) as unknown as KeyboardEvent;

describe('useListboxNavigation', () => {
  it('starts on the chosen option and wraps around both ends', () => {
    const { result } = renderHook(() =>
      useListboxNavigation(OPTIONS, 'c', vi.fn())
    );
    expect(result.current.activeIndex).toBe(2);

    act(() => result.current.onKeyDown(key('ArrowDown')));
    expect(result.current.activeIndex).toBe(0);

    act(() => result.current.onKeyDown(key('ArrowUp')));
    expect(result.current.activeIndex).toBe(2);
  });

  it('has nothing active in an empty list', () => {
    const choose = vi.fn();
    const { result } = renderHook(() => useListboxNavigation([], 'a', choose));

    act(() => result.current.onKeyDown(key('ArrowDown')));
    act(() => result.current.onKeyDown(key('Enter')));

    expect(result.current.activeIndex).toBe(-1);
    expect(choose).not.toHaveBeenCalled();
  });
});
