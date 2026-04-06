import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { createLogger } from '@/lib/logger';
import { getDashboardStats } from '@/lib/queries/admin/get-dashboard-stats';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:stats');

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, 'Failed to fetch stats');
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
