import { NextRequest, NextResponse } from 'next/server';

import { loadUsersPage } from '@/app/api/admin/users/load-users-page';
import { parseUsersQuery } from '@/app/api/admin/users/users-query';
import { requireAdmin } from '@/lib/auth/require-admin';
import { createLogger } from '@/lib/logger';
import { getErrorMessage } from '@/lib/utils/error-message';

const logger = createLogger('api:admin:users');

export async function GET(req: NextRequest) {
  try {
    const { response } = await requireAdmin(
      'Unauthorized user list access attempt'
    );
    if (response) return response;

    const parsed = parseUsersQuery(new URL(req.url).searchParams);
    if (parsed.error !== undefined) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    return NextResponse.json(await loadUsersPage(parsed.query));
  } catch (error) {
    logger.error({ error }, 'Users fetch error');
    return NextResponse.json(
      {
        error: 'Nie udało się pobrać użytkowników',
        message: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
