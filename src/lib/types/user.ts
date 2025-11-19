import { Apartment, User } from '@/generated/prisma';

export type { User };

export type UserWithApartments = User & {
  apartments: Apartment[];
};
