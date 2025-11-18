import { Apartment, HomeownersAssociation, User } from '@/generated/prisma';

export type { Apartment, HomeownersAssociation };

export type ApartmentWithUser = Apartment & {
  user: Omit<User, 'password'> | null;
};

export type ApartmentWithHOA = Apartment & {
  homeownersAssociation: HomeownersAssociation;
};

export type ApartmentWithRelations = Apartment & {
  user: Omit<User, 'password'> | null;
  homeownersAssociation: HomeownersAssociation;
};
