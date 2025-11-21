'use client';

import Link from 'next/link';
import { useState } from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
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
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader>
            <CardTitle>Sprawdź swoją skrzynkę email</CardTitle>
            <CardDescription>
              Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje
              resetowania hasła.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Wróć do logowania
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 animate-fade-in">
      <div className="absolute right-4 top-4 animate-slide-in-top">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader>
          <CardTitle>Zapomniałeś hasła?</CardTitle>
          <CardDescription>
            Podaj swój adres email, a wyślemy Ci link do zresetowania hasła.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="twoj@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-800 dark:text-red-400">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Wysyłanie...' : 'Wyślij link resetowania'}
            </Button>

            <div className="text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                Wróć do logowania
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
