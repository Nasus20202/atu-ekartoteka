import {
  AccountStatus as PrismaAccountStatus,
  UserRole as PrismaUserRole,
} from '@/generated/prisma';

export const UserRole = PrismaUserRole;
export const AccountStatus = PrismaAccountStatus;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export type AccountStatus = (typeof AccountStatus)[keyof typeof AccountStatus];
