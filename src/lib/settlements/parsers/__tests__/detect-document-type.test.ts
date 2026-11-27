import { describe, expect, it } from 'vitest';

import { annualPage } from '@/__tests__/helpers/settlement-pdf/annual-page';
import {
  fixtureRows,
  row,
} from '@/__tests__/helpers/settlement-pdf/fixture-page';
import { utilityPage } from '@/__tests__/helpers/settlement-pdf/utility-page';
import { detectDocumentType } from '@/lib/settlements/parsers/detect-document-type';

describe('detectDocumentType', () => {
  it('recognises a utility settlement by its service blocks', () => {
    expect(detectDocumentType(fixtureRows([utilityPage()]))).toBe('utility');
  });

  it('recognises an annual settlement that has no title', () => {
    expect(detectDocumentType(fixtureRows([annualPage()]))).toBe('annual');
  });

  it('does not rely on a title', () => {
    const rows = fixtureRows([[row('ROZLICZENIE KOSZTÓW MEDIÓW')]]);

    expect(detectDocumentType(rows)).toBeNull();
  });

  it('refuses a document that looks like both', () => {
    const rows = fixtureRows([utilityPage(), annualPage()]);

    expect(detectDocumentType(rows)).toBeNull();
  });
});
