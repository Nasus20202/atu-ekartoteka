import { NextRequest, NextResponse } from 'next/server';

import { Prisma } from '@/generated/prisma/client';
import { requireAdmin } from '@/lib/auth/require-admin';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { findDerivedClosingTotal } from '@/lib/queries/payments/find-derived-closing-total';
import { getErrorMessage } from '@/lib/utils/error-message';
import { dateToPeriod } from '@/lib/utils/period';
import { getRequestNow } from '@/lib/utils/request-now';

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

    const [latestYears, chargesAggregate] = await Promise.all([
      // Most recent payment year per apartment
      prisma.payment.groupBy({
        by: ['apartmentId'],
        where: inHoa,
        _max: { year: true },
      }),
      prisma.chargeNotification.aggregate({
        where: inHoa,
        _sum: { totalAmount: true },
      }),
    ]);

    // One clause per distinct year keeps the query small for large HOAs.
    const apartmentsByYear = new Map<number, string[]>();
    for (const { apartmentId, _max } of latestYears) {
      const year = _max.year!;
      const apartmentIds = apartmentsByYear.get(year) ?? [];
      apartmentIds.push(apartmentId);
      apartmentsByYear.set(year, apartmentIds);
    }

    const totalClosingBalance = await findDerivedClosingTotal(
      apartmentsByYear,
      dateToPeriod(await getRequestNow())
    );
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
