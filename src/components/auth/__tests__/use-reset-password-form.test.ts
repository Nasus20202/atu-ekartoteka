import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useResetPasswordForm } from '@/components/auth/use-reset-password-form';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  reset: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/hooks/use-turnstile', () => ({
  useTurnstile: () => ({
    token: 'turnstile-token',
    reset: mocks.reset,
    isPending: false,
  }),
}));

vi.stubGlobal('fetch', mocks.fetch);

const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

function okResponse(body: unknown = {}) {
  return { ok: true, json: async () => body };
}

function errorResponse(error: string) {
  return { ok: false, json: async () => ({ error }) };
}

async function fillAndSubmit(password: string, confirmPassword: string) {
  const { result } = renderHook(() => useResetPasswordForm('reset-token'));

  act(() => {
    result.current.setPassword(password);
    result.current.setConfirmPassword(confirmPassword);
  });

  await act(async () => {
    await result.current.handleSubmit(event);
  });

  return result;
}

describe('useResetPasswordForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.fetch.mockResolvedValue(okResponse());
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const result = await fillAndSubmit('secret123', 'secret124');

    expect(result.current.error).toBe('Hasła nie są identyczne');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than the minimum', async () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    const result = await fillAndSubmit(short, short);

    expect(result.current.error).toBe(PASSWORD_TOO_SHORT_MESSAGE);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('posts the token, password and turnstile token on success', async () => {
    const result = await fillAndSubmit('secret123', 'secret123');

    expect(mocks.fetch).toHaveBeenCalledWith('/api/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'reset-token',
        password: 'secret123',
        turnstileToken: 'turnstile-token',
      }),
    });
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe('');
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('shows the API error message and resets the challenge on failure', async () => {
    mocks.fetch.mockResolvedValue(errorResponse('Link wygasł'));

    const result = await fillAndSubmit('secret123', 'secret123');

    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe('Link wygasł');
    expect(result.current.loading).toBe(false);
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('redirects to the login page once the reset succeeds', async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() => useResetPasswordForm('reset-token'));

      act(() => {
        result.current.setPassword('secret123');
        result.current.setConfirmPassword('secret123');
      });

      await act(async () => {
        await result.current.handleSubmit(event);
      });

      expect(result.current.success).toBe(true);
      expect(mocks.push).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mocks.push).toHaveBeenCalledWith('/login?reset=success');
    } finally {
      vi.useRealTimers();
    }
  });

  it('falls back to a generic message when the API returns none', async () => {
    mocks.fetch.mockResolvedValue({ ok: false, json: async () => ({}) });

    const result = await fillAndSubmit('secret123', 'secret123');

    expect(result.current.error).toBe('Wystąpił błąd');
  });

  it('refuses to submit without a token', async () => {
    const { result } = renderHook(() => useResetPasswordForm(null));

    act(() => {
      result.current.setPassword('secret123');
      result.current.setConfirmPassword('secret123');
    });

    await act(async () => {
      await result.current.handleSubmit(event);
    });

    expect(result.current.error).toBe('Brak tokenu resetowania');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
