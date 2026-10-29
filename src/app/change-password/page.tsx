'use client';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useState } from 'react';

import { refreshSessionAndRedirect } from '@/app/change-password/actions';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';
import {
  GENERIC_ERROR_MESSAGE,
  getErrorMessage,
} from '@/lib/utils/error-message';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(PASSWORD_TOO_SHORT_MESSAGE);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Hasła nie są identyczne');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Wystąpił błąd');
      }

      await refreshSessionAndRedirect();
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(getErrorMessage(err, GENERIC_ERROR_MESSAGE));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Ustaw nowe hasło"
      description="Musisz ustawić nowe hasło przed kontynuowaniem."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nowe hasło</Label>
          <Input
            id="newPassword"
            type="password"
            placeholder={`Minimum ${MIN_PASSWORD_LENGTH} znaków`}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Powtórz hasło"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
            minLength={MIN_PASSWORD_LENGTH}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Zapisywanie...' : 'Ustaw hasło'}
        </Button>
      </form>
    </AuthLayout>
  );
}
