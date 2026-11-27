// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/platform/pdf/register-fonts', async () =>
  (await import('@/__tests__/helpers/settlement-pdf/node-pdf')).nodeFonts()
);

import {
  pageTexts,
  SUBJECT,
} from '@/__tests__/helpers/settlement-pdf/node-pdf';
import { utilityDto } from '@/__tests__/helpers/settlement-pdf/settlement-dtos';
import { MetersPdfDocument } from '@/components/pdf/meters-pdf-document';
import { UtilitySettlementPdfDocument } from '@/components/pdf/utility-settlement-pdf-document';

const MANY_ROWS = 90;
// Enough extra rows to push the last section across a whole page
const MAX_EXTRA_LINES = 40;
const SLOW_MS = 60_000;

const settlement = utilityDto();
const [utility] = settlement.utilities;
const [advance] = utility.lines;
const [meter] = utility.meters;

const lines = (description: string, count: number) =>
  Array.from({ length: count }, (_, index) => ({
    ...advance,
    id: `${description}-${index}`,
    description,
  }));

describe('settlement PDF page breaks', () => {
  it('repeats the headings of a long table and cuts no row', async () => {
    const readings = Array.from({ length: MANY_ROWS }, (_, index) => ({
      ...meter,
      id: `row-${index}`,
      serialNumber: `SN${1000 + index}`,
      label: `Etykieta${1000 + index}`,
      device: `Urz${1000 + index}`,
    }));

    const pages = await pageTexts(
      <MetersPdfDocument
        {...SUBJECT}
        settlement={settlement}
        readings={readings}
      />
    );

    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) expect(page).toContain('Nr seryjny');
    for (const { serialNumber, label, device } of readings) {
      const holding = pages.filter((page) => page.includes(serialNumber));
      expect(holding).toHaveLength(1);
      expect(holding[0]).toContain(label);
      expect(holding[0]).toContain(device);
    }
    expect(pages[0]).toContain('Zużycie w okresie: 10,300 m³');
    expect(pages[0]).toContain('Okres: 30.04 – 30.09.2022');
  });

  it(
    'never leaves a section heading without its rows',
    async () => {
      for (let count = 1; count <= MAX_EXTRA_LINES; count += 1) {
        const otherLines = lines('Zaliczka CW', count);

        const pages = await pageTexts(
          <UtilitySettlementPdfDocument
            {...SUBJECT}
            settlement={{ ...settlement, otherLines }}
          />
        );

        const holding = pages.filter((page) =>
          page.includes('Odczyty liczników')
        );
        expect(holding).toHaveLength(1);
        expect(holding[0], `${count} extra lines`).toContain(
          meter.serialNumber
        );
      }
    },
    SLOW_MS
  );

  it(
    'never leaves a utility heading without its first line',
    async () => {
      for (let count = 1; count <= MAX_EXTRA_LINES; count += 1) {
        const pages = await pageTexts(
          <UtilitySettlementPdfDocument
            {...SUBJECT}
            settlement={{
              ...settlement,
              utilities: [
                { ...utility, lines: lines('Pierwsza', count) },
                {
                  ...utility,
                  code: 'ZW',
                  name: 'Druga',
                  lines: lines('Drugi', 2),
                },
              ],
            }}
          />
        );

        const holding = pages.find((page) => page.includes('Druga (ZW)'));
        expect(holding, `${count} lines before`).toContain('Drugi ');
      }
    },
    SLOW_MS
  );
});
