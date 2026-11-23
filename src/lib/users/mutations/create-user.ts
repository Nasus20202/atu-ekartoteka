import { Prisma } from '@/generated/prisma/client';
import { normalizeEmail } from '@/lib/auth/email';
import { AccountStatus, UserRole } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

const UNIQUE_VIOLATION_CODE = 'P2002';

interface CreateUserInput {
  email: string;
  hashedPassword: string;
  name: string | null;
  role: UserRole;
  status: AccountStatus;
  emailVerified: boolean;
}

/** Returns null when the email is already registered, so a lost race is not an error. */
export async function createUser({
  email,
  hashedPassword,
  name,
  role,
  status,
  emailVerified,
}: CreateUserInput) {
  try {
    return await prisma.user.create({
      data: {
        email: normalizeEmail(email),
        password: hashedPassword,
        name,
        role,
        status,
        emailVerified,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === UNIQUE_VIOLATION_CODE
    ) {
      return null;
    }
    throw error;
  }
}
