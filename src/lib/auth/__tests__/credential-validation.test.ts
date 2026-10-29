import { describe, expect, it } from 'vitest';

import {
  CREDENTIALS_REQUIRED_MESSAGE,
  INVALID_EMAIL_MESSAGE,
  validateCredentials,
} from '@/lib/auth/credential-validation';
import { PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password-rules';

describe('validateCredentials', () => {
  it.each([
    [undefined, 'Secret123', CREDENTIALS_REQUIRED_MESSAGE],
    ['a@b.pl', '', CREDENTIALS_REQUIRED_MESSAGE],
    ['not-an-email', 'Secret123', INVALID_EMAIL_MESSAGE],
    ['a@b.pl', 'short', PASSWORD_TOO_SHORT_MESSAGE],
    ['a@b.pl', 'Secret123', null],
  ])('validates %s / %s', (email, password, expected) => {
    expect(validateCredentials(email, password)).toBe(expected);
  });
});
