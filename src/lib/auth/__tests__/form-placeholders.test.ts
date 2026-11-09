import { describe, expect, it } from 'vitest';

import { AUTH_PLACEHOLDERS } from '@/lib/auth/form-placeholders';

describe('AUTH_PLACEHOLDERS', () => {
  it('uses instructional Polish text instead of sample values', () => {
    expect(AUTH_PLACEHOLDERS).toEqual({
      email: 'Wprowadź adres e-mail',
      password: 'Wprowadź hasło',
      newPassword: 'Wprowadź nowe hasło',
      confirmPassword: 'Powtórz hasło',
      confirmNewPassword: 'Powtórz nowe hasło',
      name: 'Wprowadź imię i nazwisko',
    });
  });

  it('does not repeat a sample email address', () => {
    for (const placeholder of Object.values(AUTH_PLACEHOLDERS)) {
      expect(placeholder).not.toContain('@');
    }
  });

  it('uses a distinct confirmation placeholder per password flow', () => {
    expect(AUTH_PLACEHOLDERS.confirmPassword).not.toBe(
      AUTH_PLACEHOLDERS.confirmNewPassword
    );
  });
});
