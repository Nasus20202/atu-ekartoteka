import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';

const DEFAULT_LIMIT = 50;

export async function findTenantUsers(
  status?: AccountStatus | null,
  page = 1,
  limit = DEFAULT_LIMIT,
  search?: string | null
) {
  const searchFilter: Prisma.UserWhereInput | undefined =
    search && search.trim()
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            {
              apartments: {
                some: {
                  OR: [
                    { number: { contains: search, mode: 'insensitive' } },
                    { address: { contains: search, mode: 'insensitive' } },
                    { owner: { contains: search, mode: 'insensitive' } },
                  ],
                },
              },
            },
          ],
        }
      : undefined;

  const where: Prisma.UserWhereInput = {
    role: UserRole.TENANT,
    ...(status ? { status } : {}),
    ...searchFilter,
  };

  const skip = (page - 1) * limit;

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        emailVerified: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
        apartments: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}
