import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/database/prisma';
import { AccountStatus, UserRole } from '@/lib/types';
import type { SortDirection, UserSortKey } from '@/lib/utils/sort';

const DEFAULT_LIMIT = 50;

function buildOrderBy(
  sort: UserSortKey | undefined,
  order: SortDirection
): Prisma.UserOrderByWithRelationInput[] {
  switch (sort) {
    case 'name':
      return [{ name: { sort: order, nulls: 'last' } }, { email: order }];
    case 'email':
      return [{ email: order }];
    case 'status':
      return [{ status: order }, { email: 'asc' }];
    case 'apartments':
      return [{ apartments: { _count: order } }, { email: 'asc' }];
    default:
      return [{ createdAt: 'desc' }, { id: 'asc' }];
  }
}

export async function findTenantUsers(
  status?: AccountStatus | null,
  page = 1,
  limit = DEFAULT_LIMIT,
  search?: string | null,
  role: UserRole = UserRole.TENANT,
  sort?: UserSortKey,
  order: SortDirection = 'asc'
) {
  const normalizedSearch = search?.trim();
  const searchFilter: Prisma.UserWhereInput | undefined = normalizedSearch
    ? {
        OR: [
          { name: { contains: normalizedSearch, mode: 'insensitive' } },
          { email: { contains: normalizedSearch, mode: 'insensitive' } },
          {
            apartments: {
              some: {
                OR: [
                  {
                    number: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                  {
                    address: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                  {
                    owner: {
                      contains: normalizedSearch,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            },
          },
        ],
      }
    : undefined;

  const where: Prisma.UserWhereInput = {
    role,
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
      orderBy: buildOrderBy(sort, order),
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}
