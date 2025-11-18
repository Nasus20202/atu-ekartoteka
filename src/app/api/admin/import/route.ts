import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { importApartmentsFromBuffer } from '@/lib/apartment-import';
import { UserRole } from '@/lib/constants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await importApartmentsFromBuffer(buffer);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
