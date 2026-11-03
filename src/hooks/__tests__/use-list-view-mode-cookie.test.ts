import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it } from 'vitest';

import { useListViewMode } from '@/hooks/use-list-view-mode';
import { listViewCookieName, ListViewMode } from '@/lib/list-view-mode';

const KEY = 'atu:list-view:test-cookie';

function readCookie(): string | undefined {
  return document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${listViewCookieName(KEY)}=`))
    ?.split('=')[1];
}

describe('useListViewMode cookie', () => {
  afterEach(() => {
    window.localStorage.clear();
    document.cookie = `${listViewCookieName(KEY)}=; path=/; max-age=0`;
  });

  it('writes the chosen mode to a cookie the server can read', () => {
    const { result } = renderHook(() => useListViewMode(KEY));

    act(() => result.current[1](ListViewMode.TABLE));

    expect(readCookie()).toBe('table');
  });

  it('copies a choice made before the cookie existed', () => {
    window.localStorage.setItem(KEY, 'table');

    renderHook(() => useListViewMode(KEY));

    expect(readCookie()).toBe('table');
  });

  it('renders the server-provided mode first', () => {
    function Probe() {
      const [mode] = useListViewMode(KEY, ListViewMode.TABLE);
      return createElement('span', null, mode);
    }

    expect(renderToString(createElement(Probe))).toContain('table');
  });
});
