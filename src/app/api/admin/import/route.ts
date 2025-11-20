import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { processBatchImport } from '@/lib/import/import-handler';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:import');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Parse formData first, before any auth checks that might consume the body
    const formData = await req.formData();

    // Now check authentication
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      logger.warn(
        { email: session?.user?.email || 'anonymous' },
        'Unauthorized import attempt'
      );
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const files = formData.getAll('files') as File[];

    logger.info(
      { email: session.user.email, fileCount: files.length },
      'Import initiated'
    );

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nie przesłano plików' },
        { status: 400 }
      );
    }

    const result = await processBatchImport(files);

    logger.info(
      { email: session.user.email, hoaCount: result.results.length },
      'Import completed'
    );

    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error }, 'Import error');
    return NextResponse.json(
      {
        error: 'Import nie powiódł się',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
