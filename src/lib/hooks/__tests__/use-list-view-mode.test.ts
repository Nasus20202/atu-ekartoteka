import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ListViewMode, useListViewMode } from '@/lib/hooks/use-list-view-mode';

describe('useListViewMode', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to cards', () => {
    const { result } = renderHook(() => useListViewMode('test:default'));

    expect(result.current[0]).toBe(ListViewMode.CARDS);
  });

  it('stores the chosen mode and restores it on the next mount', () => {
    const first = renderHook(() => useListViewMode('test:restore'));

    act(() => first.result.current[1](ListViewMode.TABLE));
    expect(first.result.current[0]).toBe(ListViewMode.TABLE);
    expect(window.localStorage.getItem('test:restore')).toBe('table');
    first.unmount();

    const second = renderHook(() => useListViewMode('test:restore'));
    expect(second.result.current[0]).toBe(ListViewMode.TABLE);
  });

  it('keeps modes of different lists independent', () => {
    const apartments = renderHook(() => useListViewMode('test:a'));
    const users = renderHook(() => useListViewMode('test:b'));

    act(() => apartments.result.current[1](ListViewMode.TABLE));

    expect(apartments.result.current[0]).toBe(ListViewMode.TABLE);
    expect(users.result.current[0]).toBe(ListViewMode.CARDS);
  });

  it('treats an unknown stored value as cards', () => {
    window.localStorage.setItem('test:invalid', 'grid');

    const { result } = renderHook(() => useListViewMode('test:invalid'));

    expect(result.current[0]).toBe(ListViewMode.CARDS);
  });

  it('falls back to memory when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const { result } = renderHook(() => useListViewMode('test:blocked'));
    expect(result.current[0]).toBe(ListViewMode.CARDS);

    act(() => result.current[1](ListViewMode.TABLE));

    expect(result.current[0]).toBe(ListViewMode.TABLE);
  });

  it('follows changes made in another tab', () => {
    const { result } = renderHook(() => useListViewMode('test:tabs'));

    act(() => {
      window.localStorage.setItem('test:tabs', 'table');
      window.dispatchEvent(new StorageEvent('storage', { key: 'test:tabs' }));
    });

    expect(result.current[0]).toBe(ListViewMode.TABLE);
  });

  it('renders cards on the server', () => {
    window.localStorage.setItem('test:ssr', 'table');
    const Probe = () =>
      createElement('span', null, useListViewMode('test:ssr')[0]);

    expect(renderToString(createElement(Probe))).toContain(ListViewMode.CARDS);
  });
});
