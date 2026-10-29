import { describe, expect, it } from 'vitest';

import { getPasswordChangeError } from '@/components/account/password-change';

const fields = (
  currentPassword: string,
  newPassword: string,
  confirmPassword = newPassword
) => ({ currentPassword, newPassword, confirmPassword });

describe('getPasswordChangeError', () => {
  it.each([
    [fields('', ''), null],
    [fields('', 'Secret123'), 'Obecne hasło jest wymagane aby zmienić hasło'],
    [fields('old', 'Secret123', 'Other123'), 'Hasła nie są identyczne'],
    [fields('old', 'short'), 'Hasło musi mieć minimum 8 znaków'],
    [fields('old', 'Secret123'), null],
  ])('validates %o', (input, expected) => {
    expect(getPasswordChangeError(input)).toBe(expected);
  });
});
