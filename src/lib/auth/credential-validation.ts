import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_TOO_SHORT_MESSAGE,
} from '@/lib/auth/password-rules';

export const CREDENTIALS_REQUIRED_MESSAGE = 'Email i hasło są wymagane';
export const INVALID_EMAIL_MESSAGE = 'Nieprawidłowy format email';
export const EMAIL_TAKEN_MESSAGE =
  'Użytkownik z tym adresem email już istnieje';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Returns the first validation error message, or null when valid. */
export function validateCredentials(
  email: string | undefined,
  password: string | undefined
): string | null {
  if (!email || !password) return CREDENTIALS_REQUIRED_MESSAGE;
  if (!EMAIL_PATTERN.test(email)) return INVALID_EMAIL_MESSAGE;
  if (password.length < MIN_PASSWORD_LENGTH) return PASSWORD_TOO_SHORT_MESSAGE;
  return null;
}
