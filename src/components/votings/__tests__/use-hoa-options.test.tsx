import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useHoaOptions } from '@/components/votings/use-hoa-options';

const ALL = [
  { id: 'h1', name: 'Lipowa' },
  { id: 'h2', name: 'Klonowa' },
];

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
);

const render = () => renderHook(() => useHoaOptions(ALL), { wrapper });

describe('useHoaOptions', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('offers the whole list without asking while nothing is typed', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);

    const { result } = render();

    expect(result.current.options).toEqual(ALL);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('asks the database for the typed text', async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ homeownersAssociations: [ALL[1]] }),
    });
    vi.stubGlobal('fetch', fetch);
    const { result } = render();

    act(() => result.current.setSearch(' klon '));

    await waitFor(() => expect(result.current.options).toEqual([ALL[1]]));
    expect(fetch).toHaveBeenCalledWith('/api/admin/hoa?search=klon');
  });

  it('reports a failed search', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const { result } = render();

    act(() => result.current.setSearch('klon'));

    await waitFor(() => expect(result.current.failed).toBe(true));
  });
});
