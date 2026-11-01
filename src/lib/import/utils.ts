import { EntityStats, ImportError, ImportFileGroup } from '@/lib/import/types';
import { decodeBuffer, parseYyyymmdd } from '@/lib/parsers/parser-utils';
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

type WmbFileField = keyof Pick<
  ImportFileGroup,
  'apartmentsWmbFiles' | 'chargesWmbFiles' | 'notificationsWmbFiles'
>;

const WMB_EXTENSION = '.wmb';

// Same prefixes as the .txt files, plus the legacy charges name nalicz_ost_wys.wmb
const WMB_FILE_PREFIXES: [string, WmbFileField][] = [
  ['nal_czynsz', 'chargesWmbFiles'],
  ['nalicz', 'chargesWmbFiles'],
  ['pow_czynsz', 'notificationsWmbFiles'],
  ['lok', 'apartmentsWmbFiles'],
];

export function getWmbFileField(fileName: string): WmbFileField | undefined {
  const name = fileName.toLowerCase();
  if (!name.endsWith(WMB_EXTENSION)) return undefined;
  return WMB_FILE_PREFIXES.find(([prefix]) => name.startsWith(prefix))?.[1];
}

export function createEmptyStats(): EntityStats {
  return { created: 0, updated: 0, skipped: 0, deleted: 0, total: 0 };
}

export function isKnownFile(fileName: string): boolean {
  return (
    getTxtFileField(fileName) !== undefined ||
    fileName.toLowerCase().endsWith(WMB_EXTENSION)
  );
}

export async function parseFileToBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

/** Parses a YYYYMMDD date string from a WMB file buffer. Returns midnight UTC Date or undefined. */
export async function parseWmbDate(buffer: Buffer): Promise<Date | undefined> {
  return parseYyyymmdd(await decodeBuffer(buffer)) ?? undefined;
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
      const wmbField = getWmbFileField(fileName);
      if (wmbField) {
        entry[wmbField] = [...(entry[wmbField] ?? []), file];
      } else if (txtField) {
        entry[txtField] = [...(entry[txtField] ?? []), file];
      } else if (!isKnownFile(fileName)) {
        throw new Error(`Nieznany plik: ${fileName}`);
      }

      filesByHOA.set(hoaId, entry);
    } catch (error) {
      errors.push({
        kind: 'file-error',
        file: file.name,
        message: getErrorMessage(error),
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
