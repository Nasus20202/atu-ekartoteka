import { describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  utilitySettlement: { findUnique: vi.fn() },
  annualCostSettlement: { findUnique: vi.fn() },
}));

vi.mock('@/lib/platform/database/prisma', () => ({ prisma: db }));

import {
  parsedAnnualRecord,
  parsedUtilityRecord,
} from '@/__tests__/helpers/settlement-pdf/parsed-records';
import {
  annualData,
  utilityData,
} from '@/lib/settlements/mutations/settlement-data';
import {
  findStoredAnnualContent,
  findStoredUtilityContent,
} from '@/lib/settlements/queries/find-stored-settlement';
import { canonicalContent } from '@/lib/settlements/rules/record-content';
import { toDecimal } from '@/lib/shared/utils/decimal';

const PERIOD = { periodFrom: '2022-05-01', periodTo: '2022-09-30' };

describe('stored settlement content', () => {
  it('is null when nothing is stored', async () => {
    db.utilitySettlement.findUnique.mockResolvedValue(null);
    db.annualCostSettlement.findUnique.mockResolvedValue(null);

    expect(await findStoredUtilityContent('a1', PERIOD)).toBeNull();
    expect(await findStoredAnnualContent('a1', PERIOD)).toBeNull();
  });

  it('equals the utility record it was written from', async () => {
    const record = parsedUtilityRecord();
    const { header, lines, summaries, readings } = utilityData(record, 'a');
    // The database returns children in any order
    db.utilitySettlement.findUnique.mockResolvedValue({
      ...header,
      lines: [...lines].reverse(),
      summaries,
      readings,
    });

    const stored = await findStoredUtilityContent('a1', record);

    expect(canonicalContent(stored!)).toBe(canonicalContent(record));
    expect(
      canonicalContent({ ...stored!, totalAmount: toDecimal('1') })
    ).not.toBe(canonicalContent(record));
  });

  it('equals the annual record it was written from', async () => {
    const record = parsedAnnualRecord();
    const { header, items } = annualData(record, 'a');
    db.annualCostSettlement.findUnique.mockResolvedValue({ ...header, items });

    const stored = await findStoredAnnualContent('a1', record);

    expect(canonicalContent(stored!)).toBe(canonicalContent(record));
  });
});
