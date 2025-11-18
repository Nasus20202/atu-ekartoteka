import {
  importApartmentsFromBuffer,
  ImportResult,
} from '@/lib/apartment-import';

export interface ImportFileGroup {
  lokFile?: File;
  chargesFile?: File;
}

export interface HOAImportResult extends ImportResult {
  hoaId: string;
}

export interface ImportError {
  hoaId?: string;
  file?: string;
  error: string;
}

export interface BatchImportResult {
  success: boolean;
  results: HOAImportResult[];
  errors: ImportError[];
}

export async function processBatchImport(
  files: File[]
): Promise<BatchImportResult> {
  const results: HOAImportResult[] = [];
  const errors: ImportError[] = [];

  // Group files by HOA ID
  const filesByHOA = new Map<string, ImportFileGroup>();

  for (const file of files) {
    try {
      const pathParts = file.name.split('/');
      if (pathParts.length < 2) {
        throw new Error(
          `Nieprawidłowa struktura pliku: ${file.name}. Oczekiwano {ID_WSPÓLNOTY}/lok.txt lub {ID_WSPÓLNOTY}/nal_czynsz.txt`
        );
      }

      const fileName = pathParts[pathParts.length - 1];
      const hoaId = pathParts[pathParts.length - 2];

      if (fileName === 'lok.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.lokFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (fileName === 'nal_czynsz.txt') {
        const entry = filesByHOA.get(hoaId) || {};
        entry.chargesFile = file;
        filesByHOA.set(hoaId, entry);
      } else if (!fileName.endsWith('.wmb')) {
        throw new Error(
          `Nieprawidłowa nazwa pliku: ${fileName}. Oczekiwano lok.txt lub nal_czynsz.txt`
        );
      }
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  }

  // Process each HOA
  for (const [hoaId, { lokFile, chargesFile }] of filesByHOA.entries()) {
    try {
      if (!lokFile) {
        throw new Error(
          `Brak pliku lok.txt dla wspólnoty ${hoaId}. Plik lok.txt jest wymagany.`
        );
      }

      console.log(`Starting import for HOA ${hoaId}...`);

      const lokBytes = await lokFile.arrayBuffer();
      const lokBuffer = Buffer.from(lokBytes);

      let chargesBuffer: Buffer | undefined;
      if (chargesFile) {
        console.log(`Found charges file for HOA ${hoaId}`);
        const chargesBytes = await chargesFile.arrayBuffer();
        chargesBuffer = Buffer.from(chargesBytes);
      }

      const result = await importApartmentsFromBuffer(
        lokBuffer,
        hoaId,
        chargesBuffer
      );

      results.push({
        hoaId,
        ...result,
      });

      console.log(`Import completed for HOA ${hoaId}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Nieznany błąd';
      console.error(`Import failed for HOA ${hoaId}: ${errorMsg}`);
      errors.push({
        hoaId,
        error: errorMsg,
      });
    }
  }

  return {
    success: errors.length === 0,
    results,
    errors,
  };
}
