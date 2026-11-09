'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

import { AuthLoading } from '@/components/auth/auth-loading';
import { useVerifyEmail } from '@/components/auth/use-verify-email';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

function VerifyEmailContent() {
  const token = useSearchParams().get('token');
  const { verifying, error, success } = useVerifyEmail(token);

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
          Przekierowywanie do pulpitu...
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
        <AlertDescription>
          {error || 'Brak tokenu weryfikacyjnego w linku'}
        </AlertDescription>
      </Alert>
      <Button asChild className="w-full">
        <Link href="/login">Wróć do logowania</Link>
      </Button>
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
