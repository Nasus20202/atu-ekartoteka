import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHoaOrder } from '@/components/apartments/use-hoa-order';
import { HOA_ORDER_STORAGE_KEY } from '@/lib/hoa/rules/hoa-order';

describe('useHoaOrder', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with no custom order', () => {
    const { result } = renderHook(() => useHoaOrder());

    expect(result.current.order).toEqual([]);
  });

  it('stores the order and restores it on the next mount', () => {
    const first = renderHook(() => useHoaOrder());

    act(() => first.result.current.setOrder(['b', 'a']));
    expect(first.result.current.order).toEqual(['b', 'a']);
    expect(window.localStorage.getItem(HOA_ORDER_STORAGE_KEY)).toBe(
      '["b","a"]'
    );
    first.unmount();

    const second = renderHook(() => useHoaOrder());
    expect(second.result.current.order).toEqual(['b', 'a']);
  });

  it('shares the order between components that use it', () => {
    const one = renderHook(() => useHoaOrder());
    const two = renderHook(() => useHoaOrder());

    act(() => one.result.current.setOrder(['c', 'a']));

    expect(two.result.current.order).toEqual(['c', 'a']);
  });

  it('removes the stored order on reset', () => {
    const { result } = renderHook(() => useHoaOrder());
    act(() => result.current.setOrder(['b', 'a']));

    act(() => result.current.resetOrder());

    expect(result.current.order).toEqual([]);
    expect(window.localStorage.getItem(HOA_ORDER_STORAGE_KEY)).toBeNull();
  });

  it('follows changes made in another tab', () => {
    const { result } = renderHook(() => useHoaOrder());

    act(() => {
      window.localStorage.setItem(HOA_ORDER_STORAGE_KEY, '["z","y"]');
      window.dispatchEvent(new StorageEvent('storage'));
    });

    expect(result.current.order).toEqual(['z', 'y']);
  });

  it('ignores a stored value that is not an order', () => {
    window.localStorage.setItem(HOA_ORDER_STORAGE_KEY, '{broken');

    const { result } = renderHook(() => useHoaOrder());

    expect(result.current.order).toEqual([]);
  });

  it('keeps working when the browser refuses site storage', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied', 'SecurityError');
    });
    const { result } = renderHook(() => useHoaOrder());

    act(() => result.current.setOrder(['b', 'a']));
    expect(result.current.order).toEqual(['b', 'a']);

    vi.restoreAllMocks();
    act(() => result.current.resetOrder());
    expect(result.current.order).toEqual([]);
  });

  it('renders without a custom order on the server', () => {
    window.localStorage.setItem(HOA_ORDER_STORAGE_KEY, '["b","a"]');
    let seen: string[] | null = null;

    function Probe() {
      seen = useHoaOrder().order;
      return null;
    }
    renderToString(createElement(Probe));

    expect(seen).toEqual([]);
  });
});
