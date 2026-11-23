import { isApprovedAccount } from '@/lib/auth/rules/account-access';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';

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
