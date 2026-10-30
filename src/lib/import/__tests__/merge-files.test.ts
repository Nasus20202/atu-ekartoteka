import { describe, expect, it } from 'vitest';

import { mergeParsedFiles } from '@/lib/import/merge-files';

const byId = (entry: { id: string }) => entry.id;

describe('mergeParsedFiles', () => {
  it('concatenates entries of files without shared records', () => {
    const merged = mergeParsedFiles(
      [
        { fileName: 'wplaty1.txt', entries: [{ id: 'a' }, { id: 'b' }] },
        { fileName: 'wplaty2.txt', entries: [{ id: 'c' }] },
      ],
      byId
    );

    expect(merged.errors).toEqual([]);
    expect(merged.entries.map(byId)).toEqual(['a', 'b', 'c']);
  });

  it('reports records present in two files', () => {
    const merged = mergeParsedFiles(
      [
        { fileName: 'wplaty1.txt', entries: [{ id: 'a' }, { id: 'b' }] },
        { fileName: 'wplaty2.txt', entries: [{ id: 'b' }, { id: 'c' }] },
      ],
      byId
    );

    expect(merged.errors).toEqual([
      'Zduplikowane rekordy w plikach wplaty1.txt i wplaty2.txt (1): b',
    ]);
  });

  it('allows repeated keys inside one file', () => {
    const merged = mergeParsedFiles(
      [{ fileName: 'lok.txt', entries: [{ id: 'a' }, { id: 'a' }] }],
      byId
    );

    expect(merged.errors).toEqual([]);
  });

  it('shortens long duplicate lists', () => {
    const entries = ['1', '2', '3', '4', '5', '6'].map((id) => ({ id }));
    const merged = mergeParsedFiles(
      [
        { fileName: 'a.txt', entries },
        { fileName: 'b.txt', entries },
      ],
      byId
    );

    expect(merged.errors).toEqual([
      'Zduplikowane rekordy w plikach a.txt i b.txt (6): 1, 2, 3, 4, 5, …',
    ]);
  });
});
