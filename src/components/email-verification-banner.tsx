'use client';

import { Mail, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export function EmailVerificationBanner() {
  const { data: session, update } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Don't show if dismissed, verified, or not logged in
  if (
    dismissed ||
    !session?.user ||
    (session.user as { emailVerified?: boolean }).emailVerified ||
    (session.user as { role?: string }).role === 'ADMIN'
  ) {
    return null;
  }

  const handleResend = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch('/api/resend-verification', {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - show time remaining
          throw new Error(data.error);
        }
        throw new Error(data.error);
      }
      setMessage('Email weryfikacyjny został wysłany');
      // Update session to refresh emailVerified status after verification
      setTimeout(() => update(), 1000);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800/30">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-1">
            <Mail className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Twój adres email wymaga weryfikacji
              </p>
              {message && (
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  {message}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResend}
              disabled={loading}
              className="text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:text-yellow-900 dark:hover:text-yellow-100 underline disabled:opacity-50"
            >
              {loading ? 'Wysyłanie...' : 'Wyślij ponownie'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
