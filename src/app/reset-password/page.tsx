'use client';

import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    if (password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków');
      return;
    }

    if (!token) {
      setError('Brak tokenu resetowania');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login?reset=success');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

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
          <Input
            id="password"
            type="password"
            placeholder="Hasło"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">Minimum 8 znaków</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Hasło"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={8}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
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
    <Suspense
      fallback={
        <AuthLayout>
          <div className="flex justify-center py-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
