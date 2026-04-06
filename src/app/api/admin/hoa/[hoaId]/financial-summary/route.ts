import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:hoa:financial-summary');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ hoaId: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const { hoaId } = await params;

    // Get all apartments in this HOA
    const apartments = await prisma.apartment.findMany({
      where: { homeownersAssociationId: hoaId },
      select: { id: true },
    });

    if (apartments.length === 0) {
      return NextResponse.json({
        totalClosingBalance: 0,
        totalChargesDue: 0,
      });
    }

    const apartmentIds = apartments.map((a) => a.id);

    // For each apartment find its most recent year's closing balance
    const latestPayments = await prisma.payment.findMany({
      where: { apartmentId: { in: apartmentIds } },
      select: { apartmentId: true, year: true, closingBalance: true },
      orderBy: { year: 'desc' },
    });

    // Keep only the most recent year per apartment
    const seenApartments = new Set<string>();
    let totalClosingBalance = 0;
    for (const payment of latestPayments) {
      if (!seenApartments.has(payment.apartmentId)) {
        seenApartments.add(payment.apartmentId);
        totalClosingBalance += payment.closingBalance;
      }
    }

    // Sum all charge notifications across these apartments
    const chargesAggregate = await prisma.chargeNotification.aggregate({
      where: { apartmentId: { in: apartmentIds } },
      _sum: { totalAmount: true },
    });
    const totalChargesDue = chargesAggregate._sum.totalAmount ?? 0;

    return NextResponse.json({ totalClosingBalance, totalChargesDue });
  } catch (error) {
    logger.error({ error }, 'Financial summary fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać podsumowania finansowego',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
