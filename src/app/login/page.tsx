'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Suspense, useEffect, useRef, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TurnstileConfig } from '@/lib/types/turnstile';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileConfig, setTurnstileConfig] =
    useState<TurnstileConfig | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const resetSuccess = searchParams.get('reset') === 'success';
  const registered = searchParams.get('registered') === 'true';
  const verified = searchParams.get('verified') === 'true';

  // Fetch turnstile configuration on mount
  useEffect(() => {
    const fetchTurnstileConfig = async () => {
      try {
        const response = await fetch('/api/config/turnstile');
        const config = await response.json();
        setTurnstileConfig(config);
      } catch (error) {
        console.error('Failed to fetch turnstile config:', error);
        // Default to disabled if fetch fails
        setTurnstileConfig({ siteKey: null, enabled: false });
      }
    };

    fetchTurnstileConfig();
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router]);

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        turnstileToken,
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
      // Reset Turnstile token after any login attempt (success or failure)
      setTurnstileToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  };

  const isFormDisabled =
    loading || (turnstileConfig?.enabled && !turnstileToken);

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

        {turnstileConfig?.enabled && (
          <div className="pt-2 flex items-center justify-center">
            <Turnstile
              ref={turnstileRef}
              siteKey={turnstileConfig.siteKey!}
              onSuccess={(token: string) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              onError={() => setTurnstileToken(null)}
            />
          </div>
        )}

        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          Zaloguj się
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

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Lub
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
        >
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Zaloguj się przez Google
        </Button>
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
