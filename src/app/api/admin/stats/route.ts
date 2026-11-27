import { NextResponse } from 'next/server';

import { getAssociationStats } from '@/lib/admin/queries/get-association-stats';
import { getDashboardStats } from '@/lib/admin/queries/get-dashboard-stats';
import {
  ASSOCIATIONS_QUERY_PARAM,
  ASSOCIATIONS_QUERY_VALUE,
} from '@/lib/admin/rules/stats-query';
import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { createLogger } from '@/lib/platform/logging/logger';

const logger = createLogger('api:admin:stats');

export async function GET(request: Request) {
  try {
    const { response } = await requireAdmin();
    if (response) return response;

    const withAssociations =
      new URL(request.url).searchParams.get(ASSOCIATIONS_QUERY_PARAM) ===
      ASSOCIATIONS_QUERY_VALUE;

    // Sequential, so the summary and the association groups never compete for pool connections
    const summary = await getDashboardStats();
    if (!withAssociations) return NextResponse.json(summary);

    const associations = await getAssociationStats();

    return NextResponse.json({ ...summary, associations });
  } catch (error) {
    logger.error({ error }, 'Nie udało się pobrać statystyk');
    return NextResponse.json(
      { error: 'Nie udało się pobrać statystyk' },
      { status: 500 }
    );
  }
}
