import { Apartment, User } from '@/generated/prisma/client';

export type { Apartment };

export type ApartmentWithUser = Apartment & {
  user: Omit<User, 'password'> | null;
};
