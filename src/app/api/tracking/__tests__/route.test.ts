import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: vi.fn().mockResolvedValue(undefined),
}));

describe('GET /api/tracking', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the configured snippet as JavaScript', async () => {
    vi.stubEnv('TRACKING_SCRIPT', 'window.tracked = true;');

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe(
      'text/javascript; charset=utf-8'
    );
    expect(await response.text()).toBe('window.tracked = true;');
  });

  it('returns an empty script when TRACKING_SCRIPT is unset', async () => {
    vi.stubEnv('TRACKING_SCRIPT', '');

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('');
  });

  it('caches the snippet for an hour in browsers', async () => {
    vi.stubEnv('TRACKING_SCRIPT', 'window.tracked = true;');

    const { GET } = await import('../route');
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });
});
