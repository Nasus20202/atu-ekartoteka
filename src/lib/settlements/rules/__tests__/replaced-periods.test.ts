import { describe, expect, it } from 'vitest';

import {
  FIXTURE_APARTMENT,
  utilityDocument,
} from '@/__tests__/helpers/settlement-pdf/documents';
import { replacedPeriods } from '@/lib/settlements/rules/replaced-periods';
import type {
  MatchedRecord,
  PreparedFile,
} from '@/lib/settlements/types/prepared-file';

const [printed] = utilityDocument().records;

const record = (
  periodFrom: string,
  hoaId: string | null = 'hoa-1'
): MatchedRecord => ({
  type: 'utility',
  record: { ...printed, periodFrom, periodTo: '2022-09-30' },
  apartment: hoaId
    ? { ...FIXTURE_APARTMENT, homeownersAssociationId: hoaId }
    : null,
  apartmentLabel: 'a',
  annotated: false,
  issues: [],
});

const file = (...records: MatchedRecord[]): PreparedFile => ({
  fileName: 'a.pdf',
  documentType: 'utility',
  issues: [],
  records,
});

describe('replacedPeriods', () => {
  it('lists each period once for each association of the files', () => {
    const scopes = replacedPeriods([
      file(record('2022-05-01'), record('2022-05-01')),
      file(record('2022-01-01'), record('2022-05-01', 'hoa-2')),
    ]);

    expect(scopes).toEqual([
      {
        type: 'utility',
        homeownersAssociationId: 'hoa-1',
        periods: [
          { periodFrom: '2022-05-01', periodTo: '2022-09-30' },
          { periodFrom: '2022-01-01', periodTo: '2022-09-30' },
        ],
      },
      {
        type: 'utility',
        homeownersAssociationId: 'hoa-2',
        periods: [{ periodFrom: '2022-05-01', periodTo: '2022-09-30' }],
      },
    ]);
  });

  it('names nothing for a record without an apartment', () => {
    expect(replacedPeriods([file(record('2022-05-01', null))])).toEqual([]);
  });
});
