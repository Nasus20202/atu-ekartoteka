import { Apartment, User } from '@/generated/prisma';

export type { Apartment };

export type ApartmentWithUser = Apartment & {
  user: Omit<User, 'password'> | null;
};
