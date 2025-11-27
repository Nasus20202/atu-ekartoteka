import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { prisma } from '@/lib/database/prisma';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:stats');

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      hoaCount,
      apartmentCount,
      chargeCount,
      notificationCount,
      paymentCount,
      userCount,
    ] = await Promise.all([
      prisma.homeownersAssociation.count(),
      prisma.apartment.count(),
      prisma.charge.count(),
      prisma.chargeNotification.count(),
      prisma.payment.count(),
      prisma.user.count(),
    ]);

    return NextResponse.json({
      hoa: hoaCount,
      apartments: apartmentCount,
      charges: chargeCount,
      notifications: notificationCount,
      payments: paymentCount,
      users: userCount,
    });
  } catch (error) {
    logger.error({ error }, 'Failed to fetch stats');
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
