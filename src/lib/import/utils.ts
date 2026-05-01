import { EntityStats, ImportError, ImportFileGroup } from '@/lib/import/types';
import { decodeBuffer } from '@/lib/parsers/parser-utils';

export const KNOWN_FILE_NAMES = [
  'lok.txt',
  'nal_czynsz.txt',
  'pow_czynsz.txt',
  'wplaty.txt',
];

const WMB_FILE_MAP: Record<
  string,
  keyof Pick<
    ImportFileGroup,
    'apartmentsWmbFile' | 'chargesWmbFile' | 'notificationsWmbFile'
  >
> = {
  'lokal_ost_wys.wmb': 'apartmentsWmbFile',
  'nalicz_ost_wys.wmb': 'chargesWmbFile',
  'pow_czynsz_ost_wys.wmb': 'notificationsWmbFile',
};

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

/** Parses a YYYYMMDD date string from a WMB file buffer. Returns midnight UTC Date or undefined. */
export async function parseWmbDate(buffer: Buffer): Promise<Date | undefined> {
  try {
    const content = await decodeBuffer(buffer);
    const raw = content.trim();
    if (!/^\d{8}$/.test(raw)) return undefined;
    const year = parseInt(raw.slice(0, 4), 10);
    const month = parseInt(raw.slice(4, 6), 10) - 1;
    const day = parseInt(raw.slice(6, 8), 10);
    const date = new Date(Date.UTC(year, month, day));
    if (isNaN(date.getTime())) return undefined;
    return date;
  } catch {
    return undefined;
  }
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

      if (fileName in WMB_FILE_MAP) {
        const field = WMB_FILE_MAP[fileName];
        entry[field] = file;
      } else {
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

export async function processInBatches<T>(
  items: T[],
  batchSize: number,
  handler: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let index = 0; index < items.length; index += batchSize) {
    await handler(items.slice(index, index + batchSize));
  }
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) {
    return [];
  }

  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  const workerCount =
    Number.isFinite(concurrency) && concurrency > 0
      ? Math.min(Math.floor(concurrency), items.length)
      : 1;
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
