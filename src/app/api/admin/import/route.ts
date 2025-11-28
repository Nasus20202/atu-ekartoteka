import { NextRequest, NextResponse } from 'next/server';
import { gunzipSync } from 'zlib';

import { auth } from '@/auth';
import { processBatchImport } from '@/lib/import/import-handler';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('api:admin:import');

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Check authentication first
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      logger.warn(
        { email: session?.user?.email || 'anonymous' },
        'Unauthorized import attempt'
      );
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const contentType = req.headers.get('content-type') || '';
    let files: File[];

    // Handle both JSON (base64) and FormData (multipart) formats
    let cleanImport = false;

    if (contentType.includes('application/json')) {
      // JSON format with base64 encoded files
      const body = await req.json();
      const fileData = body.files as Array<{
        path: string;
        name: string;
        content: string;
      }>;
      cleanImport = body.cleanImport === true;

      if (!fileData || fileData.length === 0) {
        return NextResponse.json(
          { error: 'Nie przesłano plików' },
          { status: 400 }
        );
      }

      // Convert base64 to File objects (decompress gzipped content)
      files = fileData.map((fileInfo) => {
        const compressedBuffer = Buffer.from(fileInfo.content, 'base64');
        const decompressedBuffer = gunzipSync(compressedBuffer);
        return new File([decompressedBuffer], fileInfo.path, {
          type: 'application/octet-stream',
        });
      });
    } else {
      // FormData format (multipart)
      const formData = await req.formData();
      files = formData.getAll('files') as File[];
    }

    logger.info(
      { email: session.user.email, fileCount: files.length, cleanImport },
      'Import initiated'
    );

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nie przesłano plików' },
        { status: 400 }
      );
    }

    const result = await processBatchImport(files, { cleanImport });

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
