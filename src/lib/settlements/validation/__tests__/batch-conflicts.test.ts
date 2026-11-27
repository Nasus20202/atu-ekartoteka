import { describe, expect, it } from 'vitest';

import { parsedUtilityRecord } from '@/__tests__/helpers/settlement-pdf/parsed-records';
import type {
  MatchedRecord,
  PreparedFile,
} from '@/lib/settlements/types/prepared-file';
import { addBatchConflicts } from '@/lib/settlements/validation/batch-conflicts';

const matched = (
  page: Parameters<typeof parsedUtilityRecord>[0] = {},
  apartmentId: string | null = 'a1'
): MatchedRecord => ({
  type: 'utility',
  record: parsedUtilityRecord(page),
  apartmentLabel: 'TST-1',
  apartment: apartmentId
    ? ({ id: apartmentId, externalApartmentId: 'TST-1' } as never)
    : null,
  annotated: false,
  issues: [],
});

const file = (fileName: string, ...records: MatchedRecord[]): PreparedFile => ({
  fileName,
  documentType: 'utility',
  records,
  issues: [],
});

const issues = (...files: PreparedFile[]) =>
  addBatchConflicts(files).map((f) =>
    f.records.flatMap((r) => r.issues.map((i) => [i.kind, i.message]))
  );

describe('addBatchConflicts', () => {
  it('reports one settlement in two files, each naming the other', () => {
    const [a, b] = issues(file('a.pdf', matched()), file('b.pdf', matched()));

    expect(a).toEqual([
      ['duplicate', expect.stringContaining('w pliku „b.pdf”')],
    ]);
    expect(b).toEqual([
      ['duplicate', expect.stringContaining('w pliku „a.pdf”')],
    ]);
  });

  it('reports two names of one apartment record for the same period', () => {
    const [both] = issues(
      file('a.pdf', matched(), matched({ owner: 'Kowalska Anna D' }))
    );

    expect(both.map(([kind]) => kind)).toEqual(['duplicate', 'duplicate']);
  });

  it('reports overlapping periods of one apartment', () => {
    const [a] = issues(
      file('a.pdf', matched()),
      file('b.pdf', matched({ period: ['01/09/2022', '31/12/2022'] }))
    );

    expect(a).toEqual([
      ['overlap', expect.stringContaining('01.09.2022–31.12.2022')],
    ]);
  });

  it('accepts other periods, apartments and unmatched owners', () => {
    expect(
      issues(
        file('a.pdf', matched(), matched({}, 'a2')),
        file('b.pdf', matched({ period: ['01/10/2022', '31/12/2022'] })),
        file('c.pdf', matched({}, null), matched({ owner: 'Nowak Jan' }, null))
      )
    ).toEqual([[], [], []]);
  });
});
