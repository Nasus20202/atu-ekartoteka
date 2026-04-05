import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { handleMustChangePassword } from '@/lib/auth/proxy-handler';

vi.mock('next/server', async (importOriginal) => {
  const actual = await importOriginal<typeof import('next/server')>();
  return {
    ...actual,
    NextResponse: {
      next: vi.fn(() => ({ type: 'next' })),
      redirect: vi.fn((url: URL) => ({
        type: 'redirect',
        url: url.toString(),
      })),
    },
  };
});

function makeRequest(
  pathname: string,
  mustChangePassword: boolean | undefined
) {
  const url = new URL(`http://localhost${pathname}`);
  return {
    nextUrl: {
      pathname,
      clone: () => new URL(url.toString()),
    },
    auth:
      mustChangePassword !== undefined
        ? { user: { mustChangePassword } }
        : null,
  } as unknown as NextRequest & { auth: Session | null };
}

describe('proxy-handler: handleMustChangePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when mustChangePassword is false', () => {
    const result = handleMustChangePassword(makeRequest('/dashboard', false));
    expect(result).toBeNull();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('returns null when no session', () => {
    const result = handleMustChangePassword(
      makeRequest('/dashboard', undefined)
    );
    expect(result).toBeNull();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects to /change-password when mustChangePassword is true', () => {
    const result = handleMustChangePassword(makeRequest('/dashboard', true));
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(redirectUrl.pathname).toBe('/change-password');
    expect(result).not.toBeNull();
  });

  it('does NOT redirect /change-password even when mustChangePassword is true', () => {
    const result = handleMustChangePassword(
      makeRequest('/change-password', true)
    );
    expect(result).toBeNull();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('does NOT redirect /api/user/profile when mustChangePassword is true', () => {
    const result = handleMustChangePassword(
      makeRequest('/api/user/profile', true)
    );
    expect(result).toBeNull();
  });

  it('does NOT redirect /api/auth routes when mustChangePassword is true', () => {
    const result = handleMustChangePassword(
      makeRequest('/api/auth/session', true)
    );
    expect(result).toBeNull();
  });

  it('does NOT redirect /login when mustChangePassword is true', () => {
    const result = handleMustChangePassword(makeRequest('/login', true));
    expect(result).toBeNull();
  });

  it('redirects /change-password to /dashboard when mustChangePassword is false', () => {
    const result = handleMustChangePassword(
      makeRequest('/change-password', false)
    );
    expect(NextResponse.redirect).toHaveBeenCalled();
    const redirectUrl = (NextResponse.redirect as ReturnType<typeof vi.fn>).mock
      .calls[0][0];
    expect(redirectUrl.pathname).toBe('/dashboard');
    expect(result).not.toBeNull();
  });

  it('does NOT redirect /change-password when no session', () => {
    const result = handleMustChangePassword(
      makeRequest('/change-password', undefined)
    );
    expect(result).toBeNull();
    expect(NextResponse.redirect).not.toHaveBeenCalled();
  });

  it('redirects /admin routes when mustChangePassword is true', () => {
    const result = handleMustChangePassword(makeRequest('/admin/users', true));
    expect(result).not.toBeNull();
    expect(NextResponse.redirect).toHaveBeenCalled();
  });
});
