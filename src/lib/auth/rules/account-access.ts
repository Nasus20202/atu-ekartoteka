import { AccountStatus } from '@/lib/auth/types/account';

interface AccountCandidate {
  status: AccountStatus;
}

/**
 * Allowlist check for account access: only an approved account may read tenant
 * data, so a new status can never be treated as access by omission.
 */
export function isApprovedStatus(
  status: AccountStatus | null | undefined
): boolean {
  return status === AccountStatus.APPROVED;
}

export function isApprovedAccount(user: AccountCandidate | null): boolean {
  return isApprovedStatus(user?.status);
}
