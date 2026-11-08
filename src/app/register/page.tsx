'use client';

import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';

import { AuthLoading } from '@/components/auth/auth-loading';
import { RegisterSuccess } from '@/components/auth/register-success';
import { TurnstileField } from '@/components/auth/turnstile-field';
import { useRegisterForm } from '@/components/auth/use-register-form';
import { useSetupStatus } from '@/components/auth/use-setup-status';
import { AuthLayout } from '@/components/layout/auth-layout';
import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { AUTH_PLACEHOLDERS } from '@/lib/auth/form-placeholders';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';

export default function RegisterPage() {
  const { isFirstAdmin, checkingSetup } = useSetupStatus();
  const {
    formData,
    setFormData,
    loading,
    error,
    success,
    turnstile,
    isFormDisabled,
    handleSubmit,
  } = useRegisterForm(isFirstAdmin);

  if (success) {
    return <RegisterSuccess isFirstAdmin={isFirstAdmin} />;
  }

  if (checkingSetup) {
    return <AuthLoading />;
  }

  return (
    <AuthLayout
      title={isFirstAdmin ? 'Konfiguracja początkowa' : 'Rejestracja'}
      description={
        isFirstAdmin
          ? 'Utwórz konto administratora, aby rozpocząć korzystanie z systemu'
          : 'Utwórz konto, aby uzyskać dostęp do systemu'
      }
      icon={
        isFirstAdmin ? (
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/50">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        ) : undefined
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Imię i nazwisko (opcjonalne)</Label>
          <Input
            id="name"
            type="text"
            placeholder={AUTH_PLACEHOLDERS.name}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder={AUTH_PLACEHOLDERS.email}
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Hasło</Label>
          <PasswordInput
            id="password"
            placeholder={AUTH_PLACEHOLDERS.password}
            autoComplete="new-password"
            value={formData.password}
            onChange={(password) => setFormData({ ...formData, password })}
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
          <p className="text-xs text-muted-foreground">
            {PASSWORD_TOO_SHORT_MESSAGE}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <PasswordInput
            id="confirmPassword"
            placeholder={AUTH_PLACEHOLDERS.confirmPassword}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(confirmPassword) =>
              setFormData({ ...formData, confirmPassword })
            }
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <TurnstileField turnstile={turnstile} />

        <AnimatedAlert show={Boolean(error)} variant="destructive">
          {error}
        </AnimatedAlert>

        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isFirstAdmin ? 'Tworzenie konta...' : 'Rejestrowanie...'}
            </>
          ) : isFirstAdmin ? (
            'Utwórz konto administratora'
          ) : (
            'Zarejestruj się'
          )}
        </Button>

        {!isFirstAdmin && (
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Masz już konto? </span>
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Zaloguj się
            </Link>
          </div>
        )}
      </form>
    </AuthLayout>
  );
}
