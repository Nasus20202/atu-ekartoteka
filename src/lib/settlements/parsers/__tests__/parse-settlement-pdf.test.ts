// @vitest-environment node
// pdf.js reads no text from a document in the simulated browser environment
import { describe, expect, it } from 'vitest';

import { annualPage } from '@/__tests__/helpers/settlement-pdf/annual-page';
import { row } from '@/__tests__/helpers/settlement-pdf/fixture-page';
import { renderFixturePdf } from '@/__tests__/helpers/settlement-pdf/render-fixture-pdf';
import { utilityPage } from '@/__tests__/helpers/settlement-pdf/utility-page';
import { parseSettlementPdf } from '@/lib/settlements/parsers/parse-settlement-pdf';

describe('parseSettlementPdf', () => {
  it('reads a utility settlement with Polish characters', async () => {
    const pdf = await renderFixturePdf([
      utilityPage({ owner: 'Żółć Łucja Śnieżyńska' }),
    ]);

    const document = await parseSettlementPdf(pdf);

    expect(document.problems).toEqual([]);
    expect(document.type).toBe('utility');
    expect(document.records).toMatchObject([
      {
        printedOwner: 'Żółć Łucja Śnieżyńska',
        apartmentExternalId: 'TST01-TST01-00000-00001M',
        periodFrom: '2022-05-01',
        periodTo: '2022-09-30',
      },
    ]);
  });

  it('reads an annual settlement without a title and skips the legend', async () => {
    const document = await parseSettlementPdf(
      await renderFixturePdf([annualPage()])
    );

    expect(document.problems).toEqual([]);
    expect(document.type).toBe('annual');
    expect(document.records).toHaveLength(1);
  });

  it('rejects a document of another kind', async () => {
    const pdf = await renderFixturePdf([[row('Faktura VAT 1/2026')]]);

    const document = await parseSettlementPdf(pdf);

    expect(document.type).toBeNull();
    expect(document.problems).toMatchObject([{ kind: 'unknown-document' }]);
  });

  it('reports a file that is not a PDF', async () => {
    const document = await parseSettlementPdf(Buffer.from('not a pdf'));

    expect(document.type).toBeNull();
    expect(document.problems).toMatchObject([{ kind: 'unreadable' }]);
  });
});
