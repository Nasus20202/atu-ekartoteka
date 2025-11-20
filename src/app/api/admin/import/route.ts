import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { processBatchImport } from '@/lib/import/import-handler';
import { UserRole } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      console.warn(
        'Unauthorized import attempt',
        session?.user?.email || 'anonymous'
      );
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    console.log(
      `Import initiated by ${session.user.email}: ${files.length} files uploaded`
    );

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nie przesłano plików' },
        { status: 400 }
      );
    }

    const result = await processBatchImport(files);

    console.log(
      `Import completed by ${session.user.email}: ${result.results.length} HOAs processed`
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import nie powiódł się',
        message: error instanceof Error ? error.message : 'Nieznany błąd',
      },
      { status: 500 }
    );
  }
}
