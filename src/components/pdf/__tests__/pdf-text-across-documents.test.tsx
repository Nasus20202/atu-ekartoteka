// @vitest-environment node
import { Document, Page, Text } from '@react-pdf/renderer';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/platform/pdf/register-fonts', async () =>
  (await import('@/__tests__/helpers/settlement-pdf/node-pdf')).nodeFonts()
);

import { pageTexts } from '@/__tests__/helpers/settlement-pdf/node-pdf';
import { PDF_FONT_FAMILY } from '@/lib/platform/pdf/font-constants';
import { registerPdfFonts } from '@/lib/platform/pdf/register-fonts';

registerPdfFonts();

const document = (text: string) => (
  <Document>
    <Page style={{ fontFamily: PDF_FONT_FAMILY }}>
      <Text>{text}</Text>
    </Page>
  </Document>
);

// Accented letters are built from plain ones, which the first document embeds
// without ever writing them
const ACCENTED = 'ŁłÓóŚśŻżŹźĄąĘęĆćŃń';
const PLAIN = 'Ilość rozliczenia: Lokal, Odczyty, Suma zaliczek, Ewa, Cena';

describe('PDF documents built one after another', () => {
  it('keeps every letter of a later document', async () => {
    await pageTexts(document(ACCENTED));

    const [text] = await pageTexts(document(PLAIN));

    expect(text).toBe(PLAIN);
  });
});
