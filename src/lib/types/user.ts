import { User } from '@/generated/prisma';
import { Apartment } from '@/lib/types/apartment';

export type { User };

export type UserWithApartments = User & {
  apartments: Apartment[];
};
