import type { AccountStatus, UserRole } from '@/lib/auth/types/account';

export type EditMode =
  'approve' | 'change-status' | 'assign-apartment' | 'create-user' | null;

export interface NewUserFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
}
