import { NextRequest, NextResponse } from 'next/server';

import { readUploadRequest } from '@/app/api/admin/import/settlements/read-request';
import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { createLogger } from '@/lib/platform/logging/logger';
import { importSettlements } from '@/lib/settlements/use-cases/import-settlements';

const logger = createLogger('api:admin:import:settlements');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized settlement import attempt'
    );
    if (response) return response;

    const upload = await readUploadRequest(req);
    if (upload.response) return upload.response;

    const result = await importSettlements(
      upload.uploads,
      upload.confirmations,
      upload.options
    );

    // File names and findings can name owners, so only counts are logged
    logger.info(
      {
        adminId: session.user.id,
        ...upload.options,
        removedCount: result.removed,
        fileCount: result.files.length,
        importedCount: result.files.filter((file) => file.imported).length,
        stats: result.files.map((file) => file.stats),
      },
      'Settlement import completed'
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Settlement import error');
    return NextResponse.json(
      { error: 'Import rozliczeń nie powiódł się' },
      { status: 500 }
    );
  }
}
