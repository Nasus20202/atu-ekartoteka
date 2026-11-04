import { renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useGoogleSignInEnabled } from '@/components/auth/use-google-sign-in-enabled';

/** A fresh cache per test, so one test's response is not seen by the next. */
function freshCache({ children }: { children: ReactNode }) {
  return createElement(
    SWRConfig,
    { value: { provider: () => new Map() } },
    children
  );
}

describe('useGoogleSignInEnabled', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports false until the config has loaded', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {}))
    );

    const { result } = renderHook(() => useGoogleSignInEnabled(), {
      wrapper: freshCache,
    });

    expect(result.current).toBe(false);
  });

  it('reports true when Google sign-in is configured', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ enabled: true }),
      })
    );

    const { result } = renderHook(() => useGoogleSignInEnabled(), {
      wrapper: freshCache,
    });

    await waitFor(() => expect(result.current).toBe(true));
    expect(fetch).toHaveBeenCalledWith('/api/config/google');
  });

  it('reports false when the config request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Network error'))
    );

    const { result } = renderHook(() => useGoogleSignInEnabled(), {
      wrapper: freshCache,
    });

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(result.current).toBe(false);
  });
});
