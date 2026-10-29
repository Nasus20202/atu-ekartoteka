'use client';

import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { getPasswordChangeError } from '@/components/account/password-change';
import { PasswordInput } from '@/components/account/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { logger } from '@/lib/logger';
import { AuthMethod } from '@/lib/types';

type ProfileFormProps = {
  initialName: string | null;
  authMethod: AuthMethod;
};

export function ProfileForm({ initialName, authMethod }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{ password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    const passwordError = getPasswordChangeError(formData);
    if (passwordError) {
      setErrors({ password: passwordError });
      return;
    }

    setLoading(true);

    try {
      const body: {
        name?: string;
        currentPassword?: string;
        newPassword?: string;
      } = {};

      if (formData.name) {
        body.name = formData.name;
      }

      if (formData.newPassword && formData.currentPassword) {
        body.currentPassword = formData.currentPassword;
        body.newPassword = formData.newPassword;
      }

      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSuccess(true);
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        router.refresh();
      } else {
        const data = await response.json();
        setErrors({
          password: data.error || 'Nie udało się zaktualizować profilu',
        });
      }
    } catch (error) {
      logger.error({ error }, 'Failed to update profile');
      setErrors({ password: 'Wystąpił błąd podczas aktualizacji profilu' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          Profil został zaktualizowany
        </div>
      )}

      {/* Name Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Imię i nazwisko</Label>
          <Input
            id="name"
            placeholder="Imię i nazwisko"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
        </div>
      </div>

      {/* Password Section */}
      {authMethod === AuthMethod.CREDENTIALS ? (
        <div className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Obecne hasło</Label>
            <PasswordInput
              id="currentPassword"
              placeholder="Hasło"
              value={formData.currentPassword}
              onChange={(currentPassword) =>
                setFormData({ ...formData, currentPassword })
              }
            />
          </div>

          <div>
            <Label htmlFor="newPassword">Nowe hasło</Label>
            <PasswordInput
              id="newPassword"
              placeholder="Nowe hasło"
              value={formData.newPassword}
              onChange={(newPassword) =>
                setFormData({ ...formData, newPassword })
              }
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Potwierdź nowe hasło"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>

          {errors.password && (
            <p className="text-sm text-red-600">{errors.password}</p>
          )}

          <p className="text-sm text-muted-foreground">
            Pozostaw puste, aby nie zmieniać hasła
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            <p className="font-medium">
              Użytkownik zalogowany przez{' '}
              {authMethod.charAt(0).toUpperCase() +
                authMethod.slice(1).toLowerCase()}
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Zapisywanie...' : 'Zapisz zmiany'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Anuluj
        </Button>
      </div>
    </form>
  );
}
