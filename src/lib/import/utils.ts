import { EntityStats, ImportError, ImportFileGroup } from '@/lib/import/types';
import { decodeBuffer } from '@/lib/parsers/parser-utils';
import { getErrorMessage } from '@/lib/utils/error-message';

type TxtFileField = keyof Pick<
  ImportFileGroup,
  'lokFiles' | 'chargesFiles' | 'notificationsFiles' | 'paymentsFiles'
>;

const TXT_EXTENSION = '.txt';

// Exports may carry a suffix, e.g. wplaty_2026.txt or nal_czynsz_test.txt
const TXT_FILE_PREFIXES: [string, TxtFileField][] = [
  ['nal_czynsz', 'chargesFiles'],
  ['pow_czynsz', 'notificationsFiles'],
  ['wplaty', 'paymentsFiles'],
  ['lok', 'lokFiles'],
];

export function getTxtFileField(fileName: string): TxtFileField | undefined {
  const name = fileName.toLowerCase();
  if (!name.endsWith(TXT_EXTENSION)) return undefined;
  return TXT_FILE_PREFIXES.find(([prefix]) => name.startsWith(prefix))?.[1];
}

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
  return getTxtFileField(fileName) !== undefined || fileName.endsWith('.wmb');
}

export async function parseFileToBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

/** Parses a YYYYMMDD date string from a WMB file buffer. Returns midnight UTC Date or undefined. */
export async function parseWmbDate(buffer: Buffer): Promise<Date | undefined> {
  const raw = (await decodeBuffer(buffer)).trim();
  if (!/^\d{8}$/.test(raw)) return undefined;
  const year = parseInt(raw.slice(0, 4), 10);
  const month = parseInt(raw.slice(4, 6), 10) - 1;
  const day = parseInt(raw.slice(6, 8), 10);
  return new Date(Date.UTC(year, month, day));
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

      const txtField = getTxtFileField(fileName);
      if (fileName in WMB_FILE_MAP) {
        entry[WMB_FILE_MAP[fileName]] = file;
      } else if (txtField) {
        entry[txtField] = [...(entry[txtField] ?? []), file];
      } else if (!isKnownFile(fileName)) {
        throw new Error(`Nieznany plik: ${fileName}`);
      }

      filesByHOA.set(hoaId, entry);
    } catch (error) {
      errors.push({
        file: file.name,
        error: getErrorMessage(error),
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
