import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

const CHANGE_PASSWORD_PATH = '/change-password';
const DASHBOARD_PATH = '/dashboard';

const ALLOWED_PREFIXES: string[] = [
  CHANGE_PASSWORD_PATH,
  '/api/user/profile',
  '/api/auth',
  '/_next',
  '/favicon.ico',
  '/login',
  '/logout',
];

export function isAllowedPath(pathname: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function handleMustChangePassword(
  request: NextRequest & { auth: Session | null }
): NextResponse | null {
  const { pathname } = request.nextUrl;
  const session = request.auth;

  if (session?.user?.mustChangePassword && !isAllowedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = CHANGE_PASSWORD_PATH;
    return NextResponse.redirect(url);
  }

  if (
    session?.user &&
    !session.user.mustChangePassword &&
    pathname.startsWith(CHANGE_PASSWORD_PATH)
  ) {
    const url = request.nextUrl.clone();
    url.pathname = DASHBOARD_PATH;
    return NextResponse.redirect(url);
  }

  return null;
}
