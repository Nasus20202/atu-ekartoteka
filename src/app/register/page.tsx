'use client';

import { CheckCircle, Loader2, Shield } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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
  const [isFirstAdmin, setIsFirstAdmin] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);

  useEffect(() => {
    // Check if this is first run (no admin exists)
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/setup/check');
        const data = await response.json();
        setIsFirstAdmin(data.needsSetup);
      } catch (error) {
        console.error('Failed to check setup status:', error);
      } finally {
        setCheckingSetup(false);
      }
    };

    checkSetupStatus();
  }, []);

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
    if (formData.password.length < 8) {
      setError('Hasło musi mieć co najmniej 8 znaków');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Rejestracja nie powiodła się');
      }

      setSuccess(true);

      // Automatically sign in the user after registration
      const signInResult = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (signInResult?.error) {
        // If auto-login fails, redirect to login page
        setTimeout(() => {
          router.push('/login?registered=true');
        }, 2000);
      } else {
        // Successful login, redirect to dashboard
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title={
          isFirstAdmin ? 'Konto administratora utworzone!' : 'Konto utworzone!'
        }
        description={
          isFirstAdmin
            ? 'Twoje konto administratora zostało pomyślnie utworzone. Masz pełny dostęp do systemu.'
            : 'Twoje konto zostało pomyślnie utworzone i oczekuje na zatwierdzenie przez administratora.'
        }
        icon={
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
            {isFirstAdmin ? (
              <Shield className="h-8 w-8 text-green-600 dark:text-green-400" />
            ) : (
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            )}
          </div>
        }
      >
        <p className="text-center text-sm text-muted-foreground">
          Logowanie...
        </p>
      </AuthLayout>
    );
  }

  if (checkingSetup) {
    return (
      <AuthLayout>
        <div className="flex justify-center py-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
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
            placeholder="Jan Kowalski"
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
            placeholder="jan.kowalski@example.com"
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
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            disabled={loading}
            minLength={8}
          />
          <p className="text-xs text-muted-foreground">
            Hasło musi mieć co najmniej 8 znaków
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
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
