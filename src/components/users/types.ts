import type { AccountStatus, UserRole } from '@/lib/types';

export type EditMode =
  'approve' | 'change-status' | 'assign-apartment' | 'create-user' | null;

export interface NewUserFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
}
