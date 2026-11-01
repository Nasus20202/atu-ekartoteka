import { AccountStatus } from '@/lib/types';

interface AccountCandidate {
  status: AccountStatus;
}

/**
 * Allowlist check for account access: only an approved account may read tenant
 * data, so a new status can never be treated as access by omission.
 */
export function isApprovedAccount(user: AccountCandidate | null): boolean {
  return user?.status === AccountStatus.APPROVED;
}
