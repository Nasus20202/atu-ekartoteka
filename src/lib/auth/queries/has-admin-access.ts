import { isApprovedAdmin } from '@/lib/auth/rules/admin-access';
import { createLogger } from '@/lib/platform/logging/logger';
import { findUserSessionFields } from '@/lib/users/queries/find-user-session-fields';

const logger = createLogger('auth:admin-access');

/**
 * Admin rights are resolved from the database on every check: the role in the
 * JWT is a cache that only refreshes on sign-in, so a demoted admin would keep
 * API access until their token expired.
 */
export async function hasAdminAccess(userId: string): Promise<boolean> {
  const user = await findUserSessionFields(userId);

  if (!user) {
    logger.warn({ userId }, 'Admin access check failed: user no longer exists');
    return false;
  }

  return isApprovedAdmin(user);
}
