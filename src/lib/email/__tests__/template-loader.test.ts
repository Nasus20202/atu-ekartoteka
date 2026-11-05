import { describe, expect, it } from 'vitest';

import { renderEmailTemplate } from '@/lib/email/template-loader';

describe('renderEmailTemplate', () => {
  it('renders a plain-text template with its variables', () => {
    const result = renderEmailTemplate('verification-email', {
      NAME: 'John Doe',
      VERIFICATION_URL: 'https://example.com/verify?token=abc123',
    });

    expect(result).toContain('John Doe');
    expect(result).toContain('https://example.com/verify?token=abc123');
  });

  it('renders every plain-text template', () => {
    for (const name of [
      'verification-email',
      'password-reset',
      'account-approved',
      'account-activation',
      'new-user-registration-admin',
    ] as const) {
      expect(renderEmailTemplate(name, {})).toBeTruthy();
    }
  });

  it('replaces every occurrence of a variable', () => {
    const result = renderEmailTemplate('account-activation', {
      LOGIN_URL: 'https://example.com/login',
    });

    expect(result).not.toContain('{{LOGIN_URL}}');
    expect(result).toContain('https://example.com/login');
  });

  it('keeps values literal, including replacement patterns and markup', () => {
    const result = renderEmailTemplate('account-activation', {
      TEMP_PASSWORD: "$&<b>'x'",
    });

    expect(result).toContain("$&<b>'x'");
  });
});
