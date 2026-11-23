import { NextResponse } from 'next/server';

import { getDashboardStats } from '@/lib/admin/queries/get-dashboard-stats';
import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('api:admin:stats');

export async function GET() {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const stats = await getDashboardStats();

    return NextResponse.json(stats);
  } catch (error) {
    logger.error({ error }, 'Nie udało się pobrać statystyk');
    return NextResponse.json(
      { error: 'Nie udało się pobrać statystyk' },
      { status: 500 }
    );
  }
}
