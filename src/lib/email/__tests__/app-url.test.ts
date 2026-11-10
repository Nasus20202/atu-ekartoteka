import { afterEach, describe, expect, it, vi } from 'vitest';

import { appUrl } from '@/lib/email/app-url';

describe('appUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefixes the path with APP_URL', () => {
    vi.stubEnv('APP_URL', 'https://ekartoteka.example.com');

    expect(appUrl('/privacy')).toBe('https://ekartoteka.example.com/privacy');
  });

  it('falls back to the local address when APP_URL is not set', () => {
    vi.stubEnv('APP_URL', '');

    expect(appUrl('/login')).toBe('http://localhost:3000/login');
  });
});
