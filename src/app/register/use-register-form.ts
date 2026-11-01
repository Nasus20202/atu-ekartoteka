'use client';

import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { useTurnstile } from '@/lib/hooks/use-turnstile';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

const REGISTRATION_FAILED_MESSAGE = 'Rejestracja nie powiodła się';
const PASSWORDS_MISMATCH_MESSAGE = 'Hasła nie są identyczne';
const AUTO_LOGIN_FAILED_MESSAGE =
  'Konto utworzone, ale nie udało się zalogować automatycznie. Zaloguj się ręcznie.';

/** Form state and submit handling for the registration page. */
export function useRegisterForm(isFirstAdmin: boolean) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (formData.password !== formData.confirmPassword) {
      setError(PASSWORDS_MISMATCH_MESSAGE);
      return;
    }

    if (formData.password.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name || undefined,
          isFirstAdmin,
          turnstileToken: turnstile.token,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || REGISTRATION_FAILED_MESSAGE);
      }

      setSuccess(true);
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        autoLoginBypassToken: data.autoLoginToken ?? undefined,
        redirect: false,
      });

      if (loginResult?.error) {
        throw new Error(AUTO_LOGIN_FAILED_MESSAGE);
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setSuccess(false);
      setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
    } finally {
      setLoading(false);
      // Reset Turnstile token after any registration attempt (success or failure)
      turnstile.reset();
    }
  };

  return {
    formData,
    setFormData,
    loading,
    error,
    success,
    turnstile,
    isFormDisabled: loading || turnstile.isPending,
    handleSubmit,
  };
}
