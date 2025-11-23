import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyTurnstileToken } from '@/lib/turnstile';

describe('Turnstile helper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SITE_KEY;
  });

  it('returns false when token is not provided', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(false);
  });

  it('returns true when secret not set (dev)', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    const result = await verifyTurnstileToken('token');
    expect(result).toBe(true);
  });

  it('calls turnstile verify when secret is set and handles success', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        } as Response)
      )
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  it('returns false on verification failure', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: false }),
        } as Response)
      )
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(false);
  });

  it('returns false on network error', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error')))
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(false);
  });

  it('returns false when API returns error codes', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () =>
            Promise.resolve({
              success: false,
              'error-codes': ['invalid-input-response'],
            }),
        } as Response)
      )
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(false);
  });
});
