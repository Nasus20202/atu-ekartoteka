import { Apartment, User } from '@/generated/prisma/client';

export type { User };

export type UserWithApartments = User & {
  apartments: Apartment[];
};
