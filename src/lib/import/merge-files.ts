import { parseFileToBuffer } from '@/lib/import/utils';

const MAX_DUPLICATE_EXAMPLES = 5;

export interface ParsedFile<T> {
  fileName: string;
  entries: T[];
}

export interface MergedEntries<T> {
  entries: T[];
  errors: string[];
}

function baseName(file: File): string {
  return file.name.slice(file.name.lastIndexOf('/') + 1);
}

export async function parseFiles<R>(
  files: File[],
  parse: (buffer: Buffer) => Promise<R>
): Promise<{ fileName: string; result: R }[]> {
  return Promise.all(
    files.map(async (file) => ({
      fileName: baseName(file),
      result: await parse(await parseFileToBuffer(file)),
    }))
  );
}

/** Concatenates entries of files of one kind; a record present in two files is an error. */
export function mergeParsedFiles<T>(
  files: ParsedFile<T>[],
  getKey: (entry: T) => string
): MergedEntries<T> {
  const owners = new Map<string, string>();
  const duplicates = new Map<string, string[]>();

  for (const { fileName, entries } of files) {
    for (const key of new Set(entries.map(getKey))) {
      const firstFile = owners.get(key);
      if (firstFile === undefined) {
        owners.set(key, fileName);
        continue;
      }
      const pair = `${firstFile} i ${fileName}`;
      duplicates.set(pair, [...(duplicates.get(pair) ?? []), key]);
    }
  }

  const errors = Array.from(duplicates, ([pair, keys]) => {
    const examples = keys.slice(0, MAX_DUPLICATE_EXAMPLES).join(', ');
    const more = keys.length > MAX_DUPLICATE_EXAMPLES ? ', …' : '';
    return `Zduplikowane rekordy w plikach ${pair} (${keys.length}): ${examples}${more}`;
  });

  return {
    entries: files.flatMap((file) => file.entries),
    errors,
  };
}
