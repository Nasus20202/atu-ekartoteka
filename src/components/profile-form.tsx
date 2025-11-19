'use client';

import { Eye, EyeOff, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ProfileFormProps = {
  initialName: string | null;
};

export function ProfileForm({ initialName }: ProfileFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: initialName || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{
    name?: string;
    password?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    // Validate password if provided
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        setErrors({
          password: 'Obecne hasło jest wymagane aby zmienić hasło',
        });
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setErrors({ password: 'Hasła nie są identyczne' });
        return;
      }
      if (formData.newPassword.length < 6) {
        setErrors({ password: 'Hasło musi mieć minimum 6 znaków' });
        return;
      }
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
      console.error('Failed to update profile:', error);
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
            placeholder="Jan Kowalski"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>
      </div>

      {/* Password Section */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="currentPassword">Obecne hasło</Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="newPassword">Nowe hasło</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  newPassword: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmPassword">Potwierdź nowe hasło</Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
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
          Pozostaw puste aby nie zmieniać hasła
        </p>
      </div>

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
