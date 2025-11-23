'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const verifyToken = useCallback(
    async (verificationToken: string) => {
      setVerifying(true);
      setError(null);
      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: verificationToken }),
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || 'Weryfikacja nie powiodła się');
        setSuccess(true);
        // Update session to refresh emailVerified status
        await update();
        setTimeout(() => router.push('/login?verified=true'), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      } finally {
        setVerifying(false);
      }
    },
    [router, update]
  );

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      verifyToken(tokenParam);
    } else {
      setError('Brak tokenu weryfikacyjnego w linku');
      setVerifying(false);
    }
  }, [searchParams, verifyToken]);

  if (verifying) {
    return (
      <AuthLayout
        title="Weryfikacja email..."
        description="Proszę czekać"
        icon={
          <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-950/50">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        }
      >
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout
        title="Email zweryfikowany!"
        description="Twój adres email został pomyślnie zweryfikowany."
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
      title="Błąd weryfikacji"
      icon={
        <div className="rounded-full bg-red-100 p-3 dark:bg-red-950/50">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
      }
    >
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>{error || 'Wystąpił nieznany błąd'}</AlertDescription>
      </Alert>
      <Button asChild className="w-full">
        <Link href="/login">Wróć do logowania</Link>
      </Button>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
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
      <VerifyEmailContent />
    </Suspense>
  );
}
