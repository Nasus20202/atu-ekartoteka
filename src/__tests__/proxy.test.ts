import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockHandleMustChangePassword } = vi.hoisted(() => ({
  mockHandleMustChangePassword: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: <T>(handler: T) => handler,
}));
vi.mock('@/lib/auth/proxy-handler', () => ({
  handleMustChangePassword: mockHandleMustChangePassword,
}));

import { config, proxy } from '@/proxy';

type ProxyRequest = NextRequest & { auth: Session | null };
type Middleware = (request: ProxyRequest) => NextResponse;

const runProxy = (path = '/dashboard') =>
  (proxy as unknown as Middleware)(
    Object.assign(new NextRequest(`http://localhost${path}`), { auth: null })
  );

const directive = (response: NextResponse, name: string) =>
  response.headers
    .get('Content-Security-Policy')
    ?.split('; ')
    .find((part) => part.startsWith(name));

describe('proxy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleMustChangePassword.mockReturnValue(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('adds security headers to regular responses', () => {
    const response = runProxy();

    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('Strict-Transport-Security')).toContain(
      'max-age=63072000'
    );
    expect(response.headers.get('Referrer-Policy')).toBe(
      'strict-origin-when-cross-origin'
    );
    expect(response.headers.get('Permissions-Policy')).toBe(
      'camera=(), microphone=(), geolocation=()'
    );
    expect(directive(response, 'frame-ancestors')).toBe(
      "frame-ancestors 'none'"
    );
  });

  it('keeps unsafe-eval and tracking origins out of the production policy', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('TRACKING_ORIGINS', '');

    const response = runProxy();

    expect(directive(response, 'script-src')).toBe(
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com"
    );
    expect(directive(response, 'connect-src')).toBe(
      "connect-src 'self' data: https://challenges.cloudflare.com"
    );
  });

  it('allows unsafe-eval in development and adds tracking origins', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TRACKING_ORIGINS', 'https://stats.example.com');

    const response = runProxy();

    expect(directive(response, 'script-src')).toBe(
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com 'unsafe-eval' https://stats.example.com"
    );
    expect(directive(response, 'connect-src')).toContain(
      'https://stats.example.com'
    );
  });

  it('returns the password change redirect with security headers', () => {
    const redirect = NextResponse.redirect('http://localhost/change-password');
    mockHandleMustChangePassword.mockReturnValue(redirect);

    const response = runProxy();

    expect(response).toBe(redirect);
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
  });

  it('skips static assets', () => {
    const matcher = new RegExp(`^${config.matcher[0]}$`);

    expect(matcher.test('/dashboard')).toBe(true);
    expect(matcher.test('/_next/static/chunk.js')).toBe(false);
    expect(matcher.test('/logo.png')).toBe(false);
  });
});
