import { afterEach, describe, expect, it, vi } from 'vitest';

import { jsonPoster } from '@/lib/swr/json-mutation';

const FALLBACK = 'Błąd zapisu';

describe('jsonPoster', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the argument as JSON and resolves with the parsed body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 7 }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const post = jsonPoster<{ name: string }, { id: number }>(FALLBACK);

    await expect(post('/api/thing', { arg: { name: 'a' } })).resolves.toEqual({
      id: 7,
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/thing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'a' }),
    });
  });

  it('throws the server error message for a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Link wygasł' }),
      })
    );

    const post = jsonPoster<object, unknown>(FALLBACK);

    await expect(post('/api/thing', { arg: {} })).rejects.toThrow(
      'Link wygasł'
    );
  });

  it('throws the fallback message when the error body has no message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({}),
      })
    );

    const post = jsonPoster<object, unknown>(FALLBACK);

    await expect(post('/api/thing', { arg: {} })).rejects.toThrow(FALLBACK);
  });
});
