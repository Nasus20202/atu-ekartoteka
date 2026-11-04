import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useVerifyEmail } from '@/components/auth/use-verify-email';

const mocks = vi.hoisted(() => ({ push: vi.fn(), verifyEmailAction: vi.fn() }));

vi.mock('@/actions/auth/verify-email', () => ({
  verifyEmailAction: mocks.verifyEmailAction,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

function okResult() {
  return { ok: true, data: undefined };
}

function errorResult(error: string) {
  return { ok: false, code: 'invalid', error };
}

describe('useVerifyEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.verifyEmailAction.mockResolvedValue(okResult());
  });

  it('marks the email as verified and stops the spinner', async () => {
    const { result } = renderHook(() => useVerifyEmail('verify-token'));

    expect(result.current.verifying).toBe(true);

    await waitFor(() => {
      expect(result.current.verifying).toBe(false);
    });

    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
    expect(mocks.verifyEmailAction).toHaveBeenCalledWith('verify-token');
  });

  it('shows the API error message when the token is rejected', async () => {
    mocks.verifyEmailAction.mockResolvedValue(errorResult('Token wygasł'));

    const { result } = renderHook(() => useVerifyEmail('expired-token'));

    await waitFor(() => {
      expect(result.current.verifying).toBe(false);
    });

    expect(result.current.error).toBe('Token wygasł');
    expect(result.current.success).toBe(false);
  });

  it('redirects to the dashboard once the email is verified', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useVerifyEmail('verify-token'));

      await act(async () => {
        for (let i = 0; i < 5; i++) await Promise.resolve();
      });

      expect(result.current.success).toBe(true);
      expect(mocks.push).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mocks.push).toHaveBeenCalledWith('/dashboard');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to a generic message when the action throws a non-error', async () => {
    mocks.verifyEmailAction.mockRejectedValue('network down');

    const { result } = renderHook(() => useVerifyEmail('verify-token'));

    await waitFor(() => {
      expect(result.current.verifying).toBe(false);
    });

    expect(result.current.error).toBe('Wystąpił błąd');
  });

  it('does not redirect when unmounted before the response arrives', async () => {
    let resolveFetch!: (value: unknown) => void;
    mocks.verifyEmailAction.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    const { unmount } = renderHook(() => useVerifyEmail('verify-token'));
    unmount();
    resolveFetch(okResult());

    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('ignores a failure that arrives after unmount', async () => {
    let rejectFetch!: (reason: unknown) => void;
    mocks.verifyEmailAction.mockReturnValue(
      new Promise((_resolve, reject) => {
        rejectFetch = reject;
      })
    );

    const { unmount } = renderHook(() => useVerifyEmail('verify-token'));
    unmount();
    rejectFetch(new Error('network down'));

    await act(async () => {
      for (let i = 0; i < 5; i++) await Promise.resolve();
    });

    expect(mocks.push).not.toHaveBeenCalled();
  });

  it('does not call the API without a token', async () => {
    const { result } = renderHook(() => useVerifyEmail(null));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.verifying).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mocks.verifyEmailAction).not.toHaveBeenCalled();
  });
});
