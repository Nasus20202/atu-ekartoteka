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
  resetPasswordAction: vi.fn(),
}));

vi.mock('@/actions/auth/reset-password', () => ({
  resetPasswordAction: mocks.resetPasswordAction,
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

const event = { preventDefault: vi.fn() } as unknown as React.FormEvent;

function okResult() {
  return { ok: true, data: undefined };
}

function errorResult(error: string) {
  return { ok: false, code: 'invalid', error };
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
    mocks.resetPasswordAction.mockResolvedValue(okResult());
  });

  it('rejects mismatched passwords without calling the API', async () => {
    const result = await fillAndSubmit('secret123', 'secret124');

    expect(result.current.error).toBe('Hasła nie są identyczne');
    expect(mocks.resetPasswordAction).not.toHaveBeenCalled();
  });

  it('rejects a password shorter than the minimum', async () => {
    const short = 'a'.repeat(MIN_PASSWORD_LENGTH - 1);
    const result = await fillAndSubmit(short, short);

    expect(result.current.error).toBe(PASSWORD_TOO_SHORT_MESSAGE);
    expect(mocks.resetPasswordAction).not.toHaveBeenCalled();
  });

  it('posts the token, password and turnstile token on success', async () => {
    const result = await fillAndSubmit('secret123', 'secret123');

    expect(mocks.resetPasswordAction).toHaveBeenCalledWith({
      token: 'reset-token',
      password: 'secret123',
      turnstileToken: 'turnstile-token',
    });
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBe('');
    expect(mocks.reset).toHaveBeenCalledTimes(1);
  });

  it('shows the API error message and resets the challenge on failure', async () => {
    mocks.resetPasswordAction.mockResolvedValue(errorResult('Link wygasł'));

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

  it('falls back to a generic message when the action throws a non-error', async () => {
    mocks.resetPasswordAction.mockRejectedValue('network down');

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
    expect(mocks.resetPasswordAction).not.toHaveBeenCalled();
  });
});
