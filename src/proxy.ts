import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { handleMustChangePassword } from '@/lib/auth/proxy-handler';

export const proxy = auth(function middleware(
  request: NextRequest & { auth: Session | null }
) {
  return handleMustChangePassword(request) ?? NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)).*)',
  ],
};
