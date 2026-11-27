import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useMeetingApartments } from '@/components/votings/use-meeting-apartments';

const fetchMock = vi.fn();
const answer = (labels: string[]) => ({
  ok: true,
  json: async () => ({
    apartments: labels.map((label) => ({ id: label, label })),
  }),
});

const wrapper = ({ children }: { children: ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
);

describe('useMeetingApartments', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(answer(['A 1', 'A 2']));
  });
  afterEach(() => vi.unstubAllGlobals());

  const open = () => renderHook(() => useMeetingApartments('v1'), { wrapper });

  it('lists the apartments without a ballot', async () => {
    const { result } = open();

    await waitFor(() => expect(result.current.options).toHaveLength(2));
    expect(fetchMock.mock.calls[0][0]).toBe(
      '/api/admin/votings/v1/apartments?search='
    );
  });

  it('asks the server for the typed text', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.options).toHaveLength(2));
    fetchMock.mockResolvedValue(answer(['A 2']));

    act(() => result.current.setSearch('2'));
    expect(result.current.pending).toBe(true);

    await waitFor(() => expect(result.current.options).toHaveLength(1));
    expect(result.current.pending).toBe(false);
  });

  it('reads the list again after a change', async () => {
    const { result } = open();
    await waitFor(() => expect(result.current.options).toHaveLength(2));
    fetchMock.mockResolvedValue(answer(['A 2']));

    await act(() => result.current.refresh());

    await waitFor(() => expect(result.current.options).toHaveLength(1));
  });

  it('says when the search fails', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });

    const { result } = open();

    await waitFor(() => expect(result.current.failed).toBe(true));
  });
});
