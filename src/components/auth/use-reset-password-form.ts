'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { unwrapResult } from '@/actions/action-result';
import { resetPasswordAction } from '@/actions/auth/reset-password';
import { useTurnstile } from '@/hooks/use-turnstile';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

const PASSWORDS_MISMATCH_MESSAGE = 'Hasła nie są identyczne';
const MISSING_TOKEN_MESSAGE = 'Brak tokenu resetowania';
const REDIRECT_DELAY_MS = 2000;

/** Form state and submit handling for the password reset page. */
export function useResetPasswordForm(token: string | null) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(PASSWORDS_MISMATCH_MESSAGE);
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }

    if (!token) {
      setError(MISSING_TOKEN_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      unwrapResult(
        await resetPasswordAction({
          token,
          password,
          turnstileToken: turnstile.token,
        })
      );

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?reset=success');
      }, REDIRECT_DELAY_MS);
    } catch (err) {
      setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
    } finally {
      setLoading(false);
      // Reset Turnstile token after any reset attempt (success or failure)
      turnstile.reset();
    }
  };

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    success,
    error,
    turnstile,
    isFormDisabled: loading || turnstile.isPending,
    handleSubmit,
  };
}
