'use client';

import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { unwrapResult } from '@/actions/action-result';
import { forgotPasswordAction } from '@/actions/auth/forgot-password';
import { TurnstileField } from '@/components/auth/turnstile-field';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTurnstile } from '@/hooks/use-turnstile';
import { AUTH_PLACEHOLDERS } from '@/lib/auth/form-placeholders';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const turnstile = useTurnstile();

  // Fetch turnstile configuration on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      unwrapResult(
        await forgotPasswordAction({ email, turnstileToken: turnstile.token })
      );

      setSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
    } finally {
      setLoading(false);
      // Reset Turnstile token after any request attempt (success or failure)
      turnstile.reset();
    }
  };

  const isFormDisabled = loading || turnstile.isPending;

  if (success) {
    return (
      <AuthLayout
        title="Sprawdź swoją skrzynkę email"
        description="Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła."
        icon={
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        }
      >
        <Button asChild className="w-full">
          <Link href="/login">Wróć do logowania</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Przywracanie hasła"
      description="Podaj adres email konta do przywrócenia hasła"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={AUTH_PLACEHOLDERS.email}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <AnimatedAlert show={Boolean(error)} variant="destructive">
          {error}
        </AnimatedAlert>

        <TurnstileField turnstile={turnstile} />

        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          {loading ? 'Wysyłanie...' : 'Wyślij link resetowania'}
        </Button>

        <div className="text-center text-sm">
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Wróć do logowania
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
