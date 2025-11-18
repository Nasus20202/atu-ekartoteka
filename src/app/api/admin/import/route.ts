import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { importApartmentsFromBuffer } from '@/lib/apartment-import';
import { UserRole } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Brak uprawnień' }, { status: 401 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'Nie przesłano plików' },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Extract HOA ID from file path structure: {HOA_ID}/lok.txt
        const pathParts = file.name.split('/');
        if (pathParts.length < 2) {
          throw new Error(
            `Nieprawidłowa struktura pliku: ${file.name}. Oczekiwano {ID_HOA}/lok.txt`
          );
        }

        const fileName = pathParts[pathParts.length - 1];
        // HOA ID is the folder directly containing lok.txt (second to last part)
        const hoaId = pathParts[pathParts.length - 2];

        if (fileName !== 'lok.txt') {
          throw new Error(
            `Nieprawidłowa nazwa pliku: ${fileName}. Oczekiwano lok.txt`
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await importApartmentsFromBuffer(buffer, hoaId);
        results.push({
          hoaId,
          ...result,
        });
      } catch (error) {
        errors.push({
          file: file.name,
          error: error instanceof Error ? error.message : 'Nieznany błąd',
        });
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      results,
      errors,
    });
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
