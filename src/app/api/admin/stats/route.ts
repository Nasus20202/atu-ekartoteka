import { NextResponse } from 'next/server';

import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { getDashboardStats } from '@/lib/queries/admin/get-dashboard-stats';

const logger = createLogger('api:admin:stats');

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

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
