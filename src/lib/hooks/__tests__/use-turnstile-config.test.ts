import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTurnstileConfig } from '@/lib/hooks/use-turnstile-config';

describe('useTurnstileConfig', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the loaded config', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ siteKey: 'key', enabled: true }),
      })
    );

    const { result } = renderHook(() => useTurnstileConfig());

    expect(result.current).toBeNull();
    await waitFor(() =>
      expect(result.current).toEqual({ siteKey: 'key', enabled: true })
    );
  });

  it('falls back to disabled when loading fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const { result } = renderHook(() => useTurnstileConfig());

    await waitFor(() =>
      expect(result.current).toEqual({ siteKey: null, enabled: false })
    );
  });

  it('ignores a response that arrives after unmount', async () => {
    let resolve: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    );

    const { result, unmount } = renderHook(() => useTurnstileConfig());
    unmount();
    resolve({ json: () => Promise.resolve({ siteKey: 'k', enabled: true }) });
    await Promise.resolve();

    expect(result.current).toBeNull();
  });

  it('ignores a failure that arrives after unmount', async () => {
    let reject: (reason: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((_, r) => (reject = r)))
    );

    const { result, unmount } = renderHook(() => useTurnstileConfig());
    unmount();
    reject(new Error('late'));
    await Promise.resolve();

    expect(result.current).toBeNull();
  });
});
