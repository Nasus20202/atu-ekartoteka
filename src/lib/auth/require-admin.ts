import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('auth:require-admin');

export const UNAUTHORIZED_MESSAGE = 'Brak uprawnień';

type AdminCheck =
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse };

/**
 * Resolves the admin session or a 401 response to return from the route.
 * Pass `attempt` to log rejected requests.
 */
export async function requireAdmin(attempt?: string): Promise<AdminCheck> {
  const session = await auth();

  if (session?.user?.role === UserRole.ADMIN) {
    return { session };
  }

  if (attempt) {
    logger.warn({ email: session?.user?.email || 'anonymous' }, attempt);
  }

  return {
    response: NextResponse.json(
      { error: UNAUTHORIZED_MESSAGE },
      { status: 401 }
    ),
  };
}
