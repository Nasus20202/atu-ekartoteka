/**
 * Pixel regression tests for the generated PDF documents. Each downloaded PDF
 * is rendered page by page and compared with stored snapshots.
 */

import { expect, test } from '../fixtures';
import { VISUAL_YEAR } from '../utils/test-credentials';
import { downloadBytes, renderPdfPages } from './utils/pdf-pages';

// Charges months start collapsed, so open the last seeded one to show its PDF button
const CHARGES_MONTH_QUERY = `?month=${VISUAL_YEAR}-12`;
const CHARGES_PDF_BUTTON = /Pobierz PDF naliczeń/;
// The year summary card shows the text button, not the icon-only row button
const PAYMENTS_PDF_BUTTON = { name: 'Pobierz PDF', exact: true };
const NOTICE_PDF_BUTTON = 'Pobierz PDF bieżących naliczeń';

/** Compares every page with its snapshot and returns the number of pages. */
async function comparePages(pdf: Buffer, name: string): Promise<number> {
  const pages = await renderPdfPages(pdf);

  for (let index = 0; index < pages.length; index++) {
    expect(pages[index]).toMatchSnapshot(`${name}-page-${index + 1}.png`);
  }
  return pages.length;
}

test.describe('Visual: PDF documents', () => {
  test('charges PDF', async ({ visualPage }) => {
    await visualPage.goto('/dashboard');
    const chargesHref = await visualPage
      .getByRole('link', { name: 'Naliczenia', exact: true })
      .getAttribute('href');
    await visualPage.goto(`${chargesHref}${CHARGES_MONTH_QUERY}`);

    const pdf = await downloadBytes(
      visualPage.getByRole('button', { name: CHARGES_PDF_BUTTON }).first()
    );

    expect(await comparePages(pdf, 'charges-pdf')).toBeGreaterThan(0);
  });

  test('payments PDF', async ({ visualPage }) => {
    await visualPage.goto('/dashboard/payments');
    const yearHref = await visualPage
      .getByRole('link', { name: new RegExp(`Rok ${VISUAL_YEAR}`) })
      .getAttribute('href');
    await visualPage.goto(yearHref!);

    const pdf = await downloadBytes(
      visualPage.getByRole('button', PAYMENTS_PDF_BUTTON).first()
    );

    expect(await comparePages(pdf, 'payments-pdf')).toBeGreaterThan(0);
  });

  test('current notices PDF', async ({ visualPage }) => {
    await visualPage.goto('/dashboard');

    const pdf = await downloadBytes(
      visualPage.getByRole('button', { name: NOTICE_PDF_BUTTON })
    );

    expect(await comparePages(pdf, 'notice-pdf')).toBeGreaterThan(0);
  });
});
