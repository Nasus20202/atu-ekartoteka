import { isApprovedAccount } from '@/lib/auth/account-access';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { createLogger } from '@/lib/platform/logging/logger';
import { findUserSessionFields } from '@/lib/users/queries/find-user-session-fields';

const logger = createLogger('auth:admin-access');

interface AdminCandidate {
  role: UserRole;
  status: AccountStatus;
}

export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === UserRole.ADMIN;
}

export function isApprovedAdmin(user: AdminCandidate | null): boolean {
  return isApprovedAccount(user) && isAdminRole(user?.role);
}

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
