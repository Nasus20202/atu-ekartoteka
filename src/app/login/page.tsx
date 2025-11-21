'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Suspense, useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const resetSuccess = searchParams.get('reset') === 'success';
  const registered = searchParams.get('registered') === 'true';
  const verified = searchParams.get('verified') === 'true';

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Nieprawidłowy email lub hasło');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="ATU Ekartoteka"
      description="Wprowadź dane logowania, aby uzyskać dostęp do konta"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Hasło</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Przywracanie hasła
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Hasło"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {resetSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <AlertDescription className="text-green-800 dark:text-green-400">
              Hasło zostało zmienione. Możesz się teraz zalogować.
            </AlertDescription>
          </Alert>
        )}

        {registered && (
          <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <AlertDescription className="text-blue-800 dark:text-blue-400">
              Konto utworzone. Sprawdź email i zaloguj się.
            </AlertDescription>
          </Alert>
        )}

        {verified && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <AlertDescription className="text-green-800 dark:text-green-400">
              Email zweryfikowany pomyślnie!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </Button>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Nie masz konta? </span>
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Zarejestruj się
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
