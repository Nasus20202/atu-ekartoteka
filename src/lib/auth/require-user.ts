import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from '@/auth';

export const AUTH_REQUIRED_MESSAGE = 'Musisz być zalogowany';

type UserCheck =
  | { session: Session; response?: never }
  | { session?: never; response: NextResponse };

/**
 * Resolves the signed-in session or a 401 response to return from the route.
 * Use this instead of calling `auth()` directly so every protected route has
 * the same response shape and the guard is visible to the API-route lint rule.
 */
export async function requireUser(): Promise<UserCheck> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(
        { error: AUTH_REQUIRED_MESSAGE },
        { status: 401 }
      ),
    };
  }

  return { session };
}
