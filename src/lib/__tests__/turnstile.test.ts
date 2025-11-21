import { beforeEach, describe, expect, it, vi } from 'vitest';

import { verifyTurnstileToken } from '@/lib/turnstile';

describe('Turnstile helper', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it('returns false when token is not provided', async () => {
    const result = await verifyTurnstileToken(undefined);
    expect(result).toBe(false);
  });

  it('returns true when secret not set (dev)', async () => {
    const result = await verifyTurnstileToken('token');
    expect(result).toBe(true);
  });

  it('calls turnstile verify when secret is set and handles success', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: true }),
        } as any)
      )
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(true);
    expect(fetch).toHaveBeenCalled();
  });

  it('returns false on verification failure', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secret';

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          json: () => Promise.resolve({ success: false }),
        } as any)
      )
    );

    const result = await verifyTurnstileToken('token-value');
    expect(result).toBe(false);
  });
});
