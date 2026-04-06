import { prisma } from '@/lib/database/prisma';
import { AccountStatus, AuthMethod, UserRole } from '@/lib/types';

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
        email,
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
