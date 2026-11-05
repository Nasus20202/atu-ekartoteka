import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyTurnstileToken } from '@/lib/turnstile';

describe('Turnstile helper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_VERIFY_URL;
  });

  describe('verification endpoint', () => {
    const CLOUDFLARE_URL =
      'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const OVERRIDE_URL = 'http://localhost:4010/turnstile/siteverify';

    function stubFetch() {
      const fetchMock = vi.fn((_url: string) =>
        Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        } as Response)
      );
      vi.stubGlobal('fetch', fetchMock);
      return fetchMock;
    }

    beforeEach(() => {
      process.env.TURNSTILE_SITE_KEY = 'site';
      process.env.TURNSTILE_SECRET_KEY = 'secret';
    });

    it('posts to Cloudflare by default', async () => {
      const fetchMock = stubFetch();

      await verifyTurnstileToken('token');

      expect(fetchMock.mock.calls[0][0]).toBe(CLOUDFLARE_URL);
    });

    it('posts to TURNSTILE_VERIFY_URL when it is set', async () => {
      process.env.TURNSTILE_VERIFY_URL = OVERRIDE_URL;
      const fetchMock = stubFetch();

      await verifyTurnstileToken('token');

      expect(fetchMock.mock.calls[0][0]).toBe(OVERRIDE_URL);
    });

    it('fails closed when the override cannot be reached', async () => {
      process.env.TURNSTILE_VERIFY_URL = OVERRIDE_URL;
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('refused')));

      expect(await verifyTurnstileToken('token')).toBe(false);
    });
  });

  it('returns false when token is not provided', async () => {
    process.env.TURNSTILE_SITE_KEY = 'site';
    process.env.TURNSTILE_SECRET_KEY = 'secret';
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(false);
  });

  it('skips verification when the secret is not set', async () => {
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
