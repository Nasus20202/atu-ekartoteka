import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:hoa:financial-summary');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hoaId: string }> }
) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const { hoaId } = await params;

    const inHoa = { apartment: { homeownersAssociationId: hoaId } };

    // Most recent payment year per apartment
    const latestYears = await prisma.payment.groupBy({
      by: ['apartmentId'],
      where: inHoa,
      _max: { year: true },
    });

    const [closingAggregate, chargesAggregate] = await Promise.all([
      latestYears.length > 0
        ? prisma.payment.aggregate({
            where: {
              OR: latestYears.map(({ apartmentId, _max }) => ({
                apartmentId,
                year: _max.year!,
              })),
            },
            _sum: { closingBalance: true },
          })
        : null,
      prisma.chargeNotification.aggregate({
        where: inHoa,
        _sum: { totalAmount: true },
      }),
    ]);
    const totalClosingBalance =
      closingAggregate?._sum.closingBalance ?? new Prisma.Decimal(0);
    const totalChargesDue =
      chargesAggregate._sum.totalAmount ?? new Prisma.Decimal(0);

    return NextResponse.json({
      totalClosingBalance: Number(totalClosingBalance),
      totalChargesDue: Number(totalChargesDue),
    });
  } catch (error) {
    logger.error({ error }, 'Financial summary fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać podsumowania finansowego',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
