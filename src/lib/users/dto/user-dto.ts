import {
  type ApartmentSummaryDto,
  type ApartmentSummaryDtoSource,
  toApartmentSummaryDto,
} from '@/lib/apartments/dto/apartment-dto';
import { toIsoString } from '@/lib/shared/iso-string';
import type { User } from '@/lib/users/types/user';

type UserDateKey = 'createdAt' | 'updatedAt';

export type UserDtoSource = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'status'
  | 'emailVerified'
  | 'mustChangePassword'
> &
  Record<UserDateKey, Date | string> & {
    apartments?: ApartmentSummaryDtoSource[];
  };

export type UserDto = Pick<
  User,
  | 'id'
  | 'email'
  | 'name'
  | 'role'
  | 'status'
  | 'emailVerified'
  | 'mustChangePassword'
> &
  Record<UserDateKey, string> & {
    apartments?: ApartmentSummaryDto[];
  };

export function toUserDto(user: UserDtoSource): UserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    mustChangePassword: user.mustChangePassword,
    createdAt: toIsoString(user.createdAt),
    updatedAt: toIsoString(user.updatedAt),
    ...(user.apartments
      ? { apartments: user.apartments.map(toApartmentSummaryDto) }
      : {}),
  };
}
