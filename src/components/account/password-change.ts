import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-rules';

interface PasswordChangeFields {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/** Message for an invalid password change, or null when valid or unchanged. */
export function getPasswordChangeError({
  currentPassword,
  newPassword,
  confirmPassword,
}: PasswordChangeFields): string | null {
  if (!newPassword) return null;
  if (!currentPassword) return 'Obecne hasło jest wymagane aby zmienić hasło';
  if (newPassword !== confirmPassword) return 'Hasła nie są identyczne';
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return `Hasło musi mieć minimum ${MIN_PASSWORD_LENGTH} znaków`;
  }
  return null;
}
