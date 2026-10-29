import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '@/app/api/config/turnstile/route';

describe('GET /api/config/turnstile', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is enabled when both keys are set', async () => {
    vi.stubEnv('TURNSTILE_SITE_KEY', 'site');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      siteKey: 'site',
      enabled: true,
    });
  });

  it('is disabled without the secret key but still exposes the site key', async () => {
    vi.stubEnv('TURNSTILE_SITE_KEY', 'site');
    vi.stubEnv('TURNSTILE_SECRET_KEY', '');

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      siteKey: 'site',
      enabled: false,
    });
  });

  it('returns a null site key when none is configured', async () => {
    vi.stubEnv('TURNSTILE_SITE_KEY', '');
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'secret');

    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      siteKey: null,
      enabled: false,
    });
  });
});
