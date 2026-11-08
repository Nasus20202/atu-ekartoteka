'use client';

import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { Suspense, useEffect, useState } from 'react';

import { AuthLoading } from '@/components/auth/auth-loading';
import { GoogleSignInSlot } from '@/components/auth/google-sign-in';
import { TurnstileField } from '@/components/auth/turnstile-field';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AnimatedAlert } from '@/components/ui/animated-alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { useTurnstile } from '@/hooks/use-turnstile';
import { AUTH_PLACEHOLDERS } from '@/lib/auth/form-placeholders';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const turnstile = useTurnstile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status } = useSession();

  const resetSuccess = searchParams.get('reset') === 'success';

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
        turnstileToken: turnstile.token,
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
      turnstile.reset();
    }
  };

  const isFormDisabled = loading || turnstile.isPending;

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
            placeholder={AUTH_PLACEHOLDERS.email}
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
          <PasswordInput
            id="password"
            placeholder={AUTH_PLACEHOLDERS.password}
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
          />
        </div>

        {resetSuccess && (
          <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900">
            <AlertDescription className="text-green-800 dark:text-green-400">
              Hasło zostało zmienione. Możesz się teraz zalogować.
            </AlertDescription>
          </Alert>
        )}

        <AnimatedAlert show={Boolean(error)} variant="destructive">
          {error}
        </AnimatedAlert>

        <TurnstileField turnstile={turnstile} />

        <Button type="submit" className="w-full" disabled={isFormDisabled}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logowanie...
            </>
          ) : (
            'Zaloguj się'
          )}
        </Button>

        <GoogleSignInSlot onClick={handleGoogleSignIn} />

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
    <Suspense fallback={<AuthLoading />}>
      <LoginForm />
    </Suspense>
  );
}
