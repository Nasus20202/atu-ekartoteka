import type { AccountStatus, UserRole } from '@/lib/types';
import type { ApartmentSummaryDto } from '@/lib/types/dto/apartment-dto';
import type { UserDto } from '@/lib/types/dto/user-dto';

export type User = UserDto;
export type Apartment = ApartmentSummaryDto;

export type EditMode =
  | 'approve'
  | 'change-status'
  | 'assign-apartment'
  | 'create-user'
  | null;

export interface NewUserFormData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  status: AccountStatus;
}
