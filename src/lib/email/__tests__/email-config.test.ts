import { afterEach, describe, expect, it, vi } from 'vitest';

import { readEmailConfig } from '@/lib/email/email-config';

describe('readEmailConfig', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses a secure connection by default', () => {
    vi.stubEnv('SMTP_SECURE', '');

    expect(readEmailConfig().secure).toBe(true);
  });

  it('honours SMTP_SECURE=false', () => {
    vi.stubEnv('SMTP_SECURE', 'false');

    expect(readEmailConfig().secure).toBe(false);
  });

  it('reads host and port', () => {
    vi.stubEnv('SMTP_HOST', 'mail.example.com');
    vi.stubEnv('SMTP_PORT', '587');

    expect(readEmailConfig()).toMatchObject({
      host: 'mail.example.com',
      port: 587,
    });
  });
});
