import type { Session } from 'next-auth';

import { auth } from '@/auth';
import { hasAdminAccess } from '@/lib/auth/admin-access';
import { UNAUTHORIZED_MESSAGE } from '@/lib/auth/require-admin';
import { AUTH_REQUIRED_MESSAGE } from '@/lib/auth/require-user';
import { createLogger } from '@/lib/logger';

const logger = createLogger('auth:require-action');

export type ActionDenied = {
  ok: false;
  error: string;
  code: 'unauthenticated' | 'forbidden';
};

type ActionCheck =
  | { session: Session; denied?: never }
  | { session?: never; denied: ActionDenied };

const UNAUTHENTICATED: ActionDenied = {
  ok: false,
  error: AUTH_REQUIRED_MESSAGE,
  code: 'unauthenticated',
};

const FORBIDDEN: ActionDenied = {
  ok: false,
  error: UNAUTHORIZED_MESSAGE,
  code: 'forbidden',
};

/**
 * Resolves the signed-in session for a Server Action, or the denial to return.
 * Every `'use server'` module calls this (or `requireAdminAction`) first, the
 * way routes call `requireUser`: an action is a public POST endpoint, so
 * nothing may be read or written before the caller is known.
 */
export async function requireUserAction(): Promise<ActionCheck> {
  const session = await auth();

  if (!session?.user?.id) {
    return { denied: UNAUTHENTICATED };
  }

  return { session };
}

/** Like `requireUserAction`, but only an approved admin, checked in the database. */
export async function requireAdminAction(
  attempt?: string
): Promise<ActionCheck> {
  const { session, denied } = await requireUserAction();

  if (denied) {
    if (attempt) logger.warn({ email: 'anonymous' }, attempt);
    // Admin areas answer anonymous callers like the admin routes do
    return { denied: { ...denied, error: UNAUTHORIZED_MESSAGE } };
  }

  if (!(await hasAdminAccess(session.user.id))) {
    if (attempt) {
      logger.warn({ email: session.user.email || 'anonymous' }, attempt);
    }
    return { denied: FORBIDDEN };
  }

  return { session };
}
