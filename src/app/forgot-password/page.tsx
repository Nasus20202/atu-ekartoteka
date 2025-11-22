'use client';

import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { useRef, useState } from 'react';

import { AuthLayout } from '@/components/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Wystąpił błąd');
    } finally {
      setLoading(false);
      // Reset Turnstile token after any request attempt (success or failure)
      setTurnstileToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Sprawdź swoją skrzynkę email"
        description="Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła."
        icon={
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-950/50">
            <Mail className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        }
      >
        <Button asChild className="w-full">
          <Link href="/login">Wróć do logowania</Link>
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Przywracanie hasła"
      description="Podaj adres email konta do przywrócenia hasła"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loading || !turnstileToken}
        >
          {loading ? 'Wysyłanie...' : 'Wyślij link resetowania'}
        </Button>

        <div className="pt-2 flex items-center justify-center">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
            onSuccess={(token: string) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        </div>

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
