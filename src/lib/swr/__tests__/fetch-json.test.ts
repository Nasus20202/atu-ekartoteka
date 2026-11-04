import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchJson } from '@/lib/swr/fetch-json';

describe('fetchJson', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the parsed body of a successful response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ value: 1 }),
      })
    );

    await expect(fetchJson('/api/thing')).resolves.toEqual({ value: 1 });
    expect(fetch).toHaveBeenCalledWith('/api/thing');
  });

  it('throws for a non-2xx status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 503 })
    );

    await expect(fetchJson('/api/thing')).rejects.toThrow(
      'Request to /api/thing failed with status 503'
    );
  });
});
