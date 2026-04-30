import type { NewUserFormData } from '@/app/admin/users/types';
import { AccountStatus, UserRole } from '@/lib/types';

export const ROLE_OPTIONS = [
  { value: UserRole.TENANT, label: 'Użytkownik' },
  { value: UserRole.ADMIN, label: 'Administrator' },
] as const;

export const STATUS_OPTIONS = [
  { value: AccountStatus.PENDING, label: 'Oczekujący' },
  { value: AccountStatus.APPROVED, label: 'Zatwierdzony' },
  { value: AccountStatus.REJECTED, label: 'Odrzucony' },
] as const;

export function createEmptyNewUserData(): NewUserFormData {
  return {
    email: '',
    password: '',
    name: '',
    role: UserRole.TENANT,
    status: AccountStatus.PENDING,
  };
}
