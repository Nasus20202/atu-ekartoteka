import { Prisma } from '@/generated/prisma/client';
import { normalizeEmail } from '@/lib/auth/email';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

interface CreateFirstAdminInput {
  email: string;
  hashedPassword: string;
  name: string | null;
}

/**
 * Creates the initial admin only when none exists. Serializable isolation makes
 * the existence check and the insert atomic, so two concurrent setup requests
 * cannot both create an admin. Returns null when an admin already exists.
 */
export async function createFirstAdmin({
  email,
  hashedPassword,
  name,
}: CreateFirstAdminInput) {
  try {
    return await prisma.$transaction(
      async (tx) => {
        const existingAdmin = await tx.user.findFirst({
          where: { role: UserRole.ADMIN },
          select: { id: true },
        });

        if (existingAdmin) {
          return null;
        }

        return tx.user.create({
          data: {
            email: normalizeEmail(email),
            password: hashedPassword,
            name,
            role: UserRole.ADMIN,
            status: AccountStatus.APPROVED,
            emailVerified: true,
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
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );
  } catch (error) {
    // Losing the serialisable race means the other request created the admin.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2034'
    ) {
      return null;
    }
    throw error;
  }
}
