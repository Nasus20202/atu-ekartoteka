import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('GET /api/config/google', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns enabled=true when both env vars are set', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'client-secret');

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.enabled).toBe(true);
  });

  it('returns enabled=false when GOOGLE_CLIENT_ID is missing', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', 'client-secret');

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(data.enabled).toBe(false);
  });

  it('returns enabled=false when GOOGLE_CLIENT_SECRET is missing', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'client-id');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(data.enabled).toBe(false);
  });

  it('returns enabled=false when both env vars are missing', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', '');
    vi.stubEnv('GOOGLE_CLIENT_SECRET', '');

    const { GET } = await import('../route');
    const response = await GET();
    const data = await response.json();

    expect(data.enabled).toBe(false);
  });
});
