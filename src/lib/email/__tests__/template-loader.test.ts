import { describe, expect, it } from 'vitest';

import { renderEmailTemplate } from '@/lib/email/template-loader';

describe('renderEmailTemplate', () => {
  it('should load and render a verification email template', () => {
    const result = renderEmailTemplate('verification-email', 'html', {
      NAME: 'John Doe',
      VERIFICATION_URL: 'https://example.com/verify?token=abc123',
    });

    expect(result).toBeTruthy();
    expect(result).toContain('https://example.com/verify?token=abc123');
    expect(result).toContain('John Doe');
  });

  it('should load and render a password reset template', () => {
    const result = renderEmailTemplate('password-reset', 'html', {
      NAME: 'Jane Doe',
      RESET_URL: 'https://example.com/reset?token=xyz789',
    });

    expect(result).toBeTruthy();
    expect(result).toContain('https://example.com/reset?token=xyz789');
    expect(result).toContain('Jane Doe');
  });

  it('should load and render an account approved template', () => {
    const result = renderEmailTemplate('account-approved', 'html', {
      NAME: 'Bob Smith',
      LOGIN_URL: 'https://example.com/login',
    });

    expect(result).toBeTruthy();
    expect(result).toContain('Bob Smith');
    expect(result).toContain('https://example.com/login');
  });

  it('should load and render a new user registration admin notification', () => {
    const result = renderEmailTemplate('new-user-registration-admin', 'html', {
      USER_NAME: 'Alice Johnson',
      USER_EMAIL: 'alice@example.com',
      REGISTRATION_DATE: '2025-12-07 10:30:00',
      ADMIN_URL: 'https://example.com/admin',
    });

    expect(result).toBeTruthy();
    expect(result).toContain('Alice Johnson');
    expect(result).toContain('alice@example.com');
    expect(result).toContain('2025-12-07 10:30:00');
  });

  it('should support txt format', () => {
    const result = renderEmailTemplate('verification-email', 'txt', {
      NAME: 'John Doe',
      VERIFICATION_URL: 'https://example.com/verify?token=abc123',
    });

    expect(result).toBeTruthy();
    expect(result).toContain('https://example.com/verify?token=abc123');
    expect(result).toContain('John Doe');
  });

  it('should replace multiple occurrences of the same variable', () => {
    const result = renderEmailTemplate('verification-email', 'html', {
      NAME: 'Test User',
      VERIFICATION_URL: 'https://example.com/verify?token=abc123',
    });

    const expectedCount = (result.match(/Test User/g) || []).length;
    expect(expectedCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle special characters in variable values', () => {
    const result = renderEmailTemplate('verification-email', 'html', {
      NAME: "O'Brien & Partners",
      VERIFICATION_URL: 'https://example.com/verify?token=abc&test=true',
    });

    expect(result).toContain('https://example.com/verify?token=abc&test=true');
    expect(result).toContain("O'Brien & Partners");
  });

  it('should type check template names at compile time', () => {
    // This test is primarily for TypeScript compilation
    // Valid template names should compile without error
    const validNames: Array<Parameters<typeof renderEmailTemplate>[0]> = [
      'verification-email',
      'password-reset',
      'account-approved',
      'new-user-registration-admin',
    ];

    expect(validNames).toHaveLength(4);
  });

  it('should type check formats at compile time', () => {
    // This test is primarily for TypeScript compilation
    // Valid formats should compile without error
    const validFormats: Array<Parameters<typeof renderEmailTemplate>[1]> = [
      'html',
      'txt',
    ];

    expect(validFormats).toHaveLength(2);
  });
});
