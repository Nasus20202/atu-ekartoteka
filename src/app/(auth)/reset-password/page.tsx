'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AuthLoading } from '@/components/auth/auth-loading';
import { TurnstileField } from '@/components/auth/turnstile-field';
import { useResetPasswordForm } from '@/components/auth/use-reset-password-form';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { AUTH_PLACEHOLDERS } from '@/lib/auth/form-placeholders';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-rules';

function ResetPasswordContent() {
  const token = useSearchParams().get('token');
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    loading,
    success,
    error,
    turnstile,
    isFormDisabled,
    handleSubmit,
  } = useResetPasswordForm(token);

  if (!token) {
    return (
      <AuthLayout
        title="Nieprawidłowy link"
        description="Link resetowania hasła jest nieprawidłowy lub wygasł."
        icon={
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/50">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
        }
      >
        <Button asChild className="w-full">
          <Link href="/forgot-password">Wyślij nowy link resetowania</Link>
        </Button>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Hasło zostało zmienione"
        description="Twoje hasło zostało pomyślnie zmienione. Możesz się teraz zalogować."
        icon={
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Przekierowywanie do strony logowania...
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Ustaw nowe hasło"
      description="Wprowadź nowe hasło dla swojego konta."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nowe hasło</Label>
          <PasswordInput
            id="password"
            placeholder={AUTH_PLACEHOLDERS.newPassword}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            Minimum {MIN_PASSWORD_LENGTH} znaków
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder={AUTH_PLACEHOLDERS.confirmNewPassword}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <AnimatedAlert show={Boolean(error)} variant="destructive">
          {error}
        </AnimatedAlert>

        <TurnstileField turnstile={turnstile} />

        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          {loading ? 'Resetowanie...' : 'Zresetuj hasło'}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
