import { EntityStats, ImportError, ImportFileGroup } from '@/lib/import/types';

export const KNOWN_FILE_NAMES = [
  'lok.txt',
  'nal_czynsz.txt',
  'pow_czynsz.txt',
  'wplaty.txt',
];

export function createEmptyStats(): EntityStats {
  return { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };
}

export function isKnownFile(fileName: string): boolean {
  return KNOWN_FILE_NAMES.includes(fileName) || fileName.endsWith('.wmb');
}

export async function parseFileToBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

export function groupFilesByHOA(
  files: File[],
  errors: ImportError[]
): Map<string, ImportFileGroup> {
  const filesByHOA = new Map<string, ImportFileGroup>();

  for (const file of files) {
    try {
      const pathParts = file.name.split('/');
      if (pathParts.length < 2) {
        throw new Error(
          `Nieprawidłowa struktura pliku: ${file.name}. Oczekiwano {ID_WSPÓLNOTY}/lok.txt`
        );
      }

      const fileName = pathParts[pathParts.length - 1];
      const hoaId = pathParts[pathParts.length - 2];
      const entry = filesByHOA.get(hoaId) ?? {};

      switch (fileName) {
        case 'lok.txt':
          entry.lokFile = file;
          break;
        case 'nal_czynsz.txt':
          entry.chargesFile = file;
          break;
        case 'pow_czynsz.txt':
          entry.notificationsFile = file;
          break;
        case 'wplaty.txt':
          entry.paymentsFile = file;
          break;
        default:
          if (!isKnownFile(fileName)) {
            throw new Error(`Nieznany plik: ${fileName}`);
          }
          break;
      }

      filesByHOA.set(hoaId, entry);
    } catch (error) {
      errors.push({
        file: file.name,
        error: error instanceof Error ? error.message : 'Nieznany błąd',
      });
    }
  }

  return filesByHOA;
}
