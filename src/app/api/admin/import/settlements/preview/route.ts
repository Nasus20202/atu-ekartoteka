import { NextRequest, NextResponse } from 'next/server';

import { readUploadRequest } from '@/app/api/admin/import/settlements/read-request';
import { requireAdmin } from '@/lib/framework/auth/require-admin';
import { createLogger } from '@/lib/platform/logging/logger';
import { previewSettlements } from '@/lib/settlements/use-cases/preview-settlements';

const logger = createLogger('api:admin:import:settlements:preview');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { session, response } = await requireAdmin(
      'Unauthorized settlement preview attempt'
    );
    if (response) return response;

    const upload = await readUploadRequest(req);
    if (upload.response) return upload.response;

    const result = await previewSettlements(upload.uploads, upload.options);

    // File names and findings can name owners, so only counts are logged
    logger.info(
      {
        adminId: session.user.id,
        ...upload.options,
        fileCount: result.files.length,
      },
      'Settlement preview completed'
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Settlement preview error');
    return NextResponse.json(
      { error: 'Podgląd rozliczeń nie powiódł się' },
      { status: 500 }
    );
  }
}
