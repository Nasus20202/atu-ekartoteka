import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@/lib/types';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const skip = (page - 1) * limit;

    const where = {
      AND: [
        activeOnly ? { isActive: true } : {},
        search
          ? {
              OR: [
                { number: { contains: search, mode: 'insensitive' as const } },
                { owner: { contains: search, mode: 'insensitive' as const } },
                {
                  address: { contains: search, mode: 'insensitive' as const },
                },
                { city: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
      ],
    };

    const [apartments, total] = await Promise.all([
      prisma.apartment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ building: 'asc' }, { number: 'asc' }],
      }),
      prisma.apartment.count({ where }),
    ]);

    return NextResponse.json({
      apartments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Apartments fetch error:', error);
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać mieszkań',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
