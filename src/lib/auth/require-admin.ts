import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { hasAdminAccess } from '@/lib/auth/admin-access';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth:require-admin');

export const UNAUTHORIZED_MESSAGE = 'Brak uprawnień';

type AdminCheck =
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse };

/**
 * Resolves the admin session or a 403 response to return from the route.
 * Admin rights always come from the database, never from the session token.
 * Pass `attempt` to log rejected requests.
 */
export async function requireAdmin(attempt?: string): Promise<AdminCheck> {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    if (attempt) {
      logger.warn(attempt);
    }

    return {
      response: NextResponse.json(
        { error: UNAUTHORIZED_MESSAGE },
        { status: 401 }
      ),
    };
  }

  if (await hasAdminAccess(userId)) {
    return { session };
  }

  if (attempt) {
    logger.warn({ userId: session.user.id }, attempt);
  }

  return {
    response: NextResponse.json(
      { error: UNAUTHORIZED_MESSAGE },
      { status: 403 }
    ),
  };
}
