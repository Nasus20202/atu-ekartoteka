import { normalizeEmail } from '@/lib/auth/rules/email';
import { AccountStatus, AuthMethod, UserRole } from '@/lib/auth/types/account';
import { prisma } from '@/lib/platform/database/prisma';

interface CreateUserWithApartmentsInput {
  email: string;
  hashedPassword: string;
  owner: string | null;
  apartmentIds: string[];
}

export function createUserWithApartments({
  email,
  hashedPassword,
  owner,
  apartmentIds,
}: CreateUserWithApartmentsInput) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizeEmail(email),
        password: hashedPassword,
        name: owner ?? null,
        role: UserRole.TENANT,
        status: AccountStatus.APPROVED,
        emailVerified: true,
        mustChangePassword: true,
        authMethod: AuthMethod.CREDENTIALS,
      },
    });

    await tx.apartment.updateMany({
      where: { id: { in: apartmentIds } },
      data: { userId: user.id },
    });
  });
}
