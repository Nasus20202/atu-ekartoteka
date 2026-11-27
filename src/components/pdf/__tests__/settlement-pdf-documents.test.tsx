// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/platform/pdf/register-fonts', async () =>
  (await import('@/__tests__/helpers/settlement-pdf/node-pdf')).nodeFonts()
);

import {
  pageTexts,
  SUBJECT,
} from '@/__tests__/helpers/settlement-pdf/node-pdf';
import {
  annualDto,
  utilityDto,
} from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { AnnualCostsPdfDocument } from '@/components/pdf/annual-costs-pdf-document';
import { UtilitySettlementPdfDocument } from '@/components/pdf/utility-settlement-pdf-document';

const OWNER = 'Zażółć Gęślą-Jaźń';

const settlement = { ...utilityDto(), printedOwner: OWNER };

describe('settlement PDF documents', () => {
  it('prints the utility result, every line and the meters', async () => {
    const [text] = await pageTexts(
      <UtilitySettlementPdfDocument {...SUBJECT} settlement={settlement} />
    );

    for (const expected of [
      'Rozliczenie mediów - Łąkowa 5/1',
      'Wspólnota Mieszkaniowa Źródlana | Wygenerowano: 2026-11-26',
      `Właściciel: ${OWNER}`,
      'Okres: 01.05 – 30.09.2022',
      'Nadpłata za media',
      '150,40 zł',
      'Ciepła woda (CW)',
      'nadpłata: 150,40 zł',
      'Zaliczka CW',
      'Wyrównanie zaliczek CW (zużycie)',
      'Do rozliczenia',
      'Odczyty liczników',
      '7000001',
      'Plik źródłowy: media.pdf',
    ]) {
      expect(text).toContain(expected);
    }
  });

  it('prints no document details when the reader gets none', async () => {
    const [text] = await pageTexts(
      <UtilitySettlementPdfDocument
        {...SUBJECT}
        settlement={{ ...settlement, origin: null }}
      />
    );

    expect(text).toContain(`Właściciel: ${OWNER}`);
    expect(text).not.toContain('Data wystawienia');
    expect(text).not.toContain('Plik źródłowy');
  });

  it('keeps other lines under Pozostałe', async () => {
    const [advance] = settlement.utilities[0].lines;

    const [text] = await pageTexts(
      <UtilitySettlementPdfDocument
        {...SUBJECT}
        settlement={{
          ...settlement,
          otherLines: [{ ...advance, id: 'x', description: 'Abonament' }],
        }}
      />
    );

    expect(text).toContain('Pozostałe');
    expect(text).toContain('Abonament');
  });

  it('prints every annual item and the total', async () => {
    const annual = annualDto();

    const [text] = await pageTexts(
      <AnnualCostsPdfDocument {...SUBJECT} settlement={annual} />
    );

    for (const expected of [
      'Koszty rzeczywiste - Łąkowa 5/1',
      'Okres: Rok 2025',
      'Suma: nadpłata za 2025 rok',
      '1 pozycja',
      'Ciepła woda',
      'wg: Wyrównanie zaliczek CW',
      '0,0400',
      'Suma',
      'wartość dodatnia oznacza niedopłatę',
    ]) {
      expect(text).toContain(expected);
    }
  });
});
