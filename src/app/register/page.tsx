'use client';

import { Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

import { RegisterSuccess } from '@/app/register/register-success';
import { useSetupStatus } from '@/app/register/use-setup-status';
import { AuthLoading } from '@/components/auth/auth-loading';
import { TurnstileField } from '@/components/auth/turnstile-field';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import { useTurnstile } from '@/lib/hooks/use-turnstile';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

export default function RegisterPage() {
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
  const { isFirstAdmin, checkingSetup } = useSetupStatus();
  const turnstile = useTurnstile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    // Validate password length
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
        throw new Error(data.error || 'Rejestracja nie powiodła się');
      }

      setSuccess(true);
      const loginResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        autoLoginBypassToken: data.autoLoginToken ?? undefined,
        redirect: false,
      });

      if (loginResult?.error) {
        throw new Error(
          'Konto utworzone, ale nie udało się zalogować automatycznie. Zaloguj się ręcznie.'
        );
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

  const isFormDisabled = loading || turnstile.isPending;

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
            placeholder="Imię i nazwisko"
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
            placeholder="email@example.com"
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
          <Input
            id="password"
            type="password"
            placeholder="Hasło"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
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
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Potwierdź hasło"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <TurnstileField turnstile={turnstile} />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

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
