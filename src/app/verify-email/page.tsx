'use client';

import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
        setTimeout(() => router.push('/login?verified=true'), 2000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Wystąpił błąd');
      } finally {
        setVerifying(false);
      }
    },
    [router]
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <Loader2 className="mx-auto h-16 w-16 animate-spin text-blue-600" />
          <h2 className="text-3xl font-bold text-gray-900">
            Weryfikacja email...
          </h2>
          <p className="text-sm text-gray-600">Proszę czekać</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md space-y-8 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-3xl font-bold text-gray-900">
            Email zweryfikowany!
          </h2>
          <p className="text-sm text-gray-600">
            Twój adres email został pomyślnie zweryfikowany.
          </p>
          <p className="text-sm text-gray-600">
            Przekierowywanie do strony logowania...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <XCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Błąd weryfikacji</h2>
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-800">
          {error || 'Wystąpił nieznany błąd'}
        </div>
        <a
          href="/login"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Wróć do logowania
        </a>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
