/**
 * Visual regression test for the preview of a settlement file on the admin
 * import page.
 */

import type { SettlementPreviewResponse } from '../../src/lib/settlements/dto/settlement-import-dto';
import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';
import { SETTLEMENT_INPUT_SELECTOR } from '../utils/file-input';
import { waitForHydration } from '../utils/wait-for-hydration';

const FILE_NAME = 'rozliczenie.pdf';
const TALL_VIEWPORT = 1600;
const STATIC_HEADER = '.group\\/header { position: static !important; }';

// A fixed answer: the page only draws what the server found in the file
const PREVIEW: SettlementPreviewResponse = {
  removals: 0,
  files: [
    {
      fileName: FILE_NAME,
      documentType: 'annual',
      errors: [],
      warnings: [
        {
          kind: 'community',
          severity: 'warning',
          fileName: FILE_NAME,
          page: 1,
          message: 'Kwoty wspólnoty różnią się od sumy naliczeń.',
        },
      ],
      records: [
        {
          key: 'record-1',
          apartmentExternalId: 'TEST-1',
          apartmentLabel: 'Testowa 1 / 1',
          printedOwner: 'Jan Testowy',
          matchedOwner: 'Jan Testowy',
          periodFrom: '2024-01-01',
          periodTo: '2024-12-31',
          totalAmount: '-210.33',
          status: 'new',
          confirmations: [],
        },
      ],
    },
  ],
};

test('Visual: admin settlement import preview', async ({ visualAdminPage }) => {
  await visualAdminPage.route(
    '**/api/admin/import/settlements/preview',
    (route) => route.fulfill({ json: PREVIEW })
  );
  await visualAdminPage.goto('/admin/import');
  await visualAdminPage.locator(SETTLEMENT_INPUT_SELECTOR).setInputFiles({
    name: FILE_NAME,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await visualAdminPage.getByRole('button', { name: 'Sprawdź pliki' }).click();

  const file = visualAdminPage.getByRole('region', {
    name: `Plik ${FILE_NAME}`,
  });
  await file
    .getByRole('button', { name: `Pokaż rozliczenia z pliku ${FILE_NAME}` })
    .click();
  await expect(file.getByRole('table')).toBeVisible();
  await expectNoHorizontalOverflow(visualAdminPage);
  // A tall element screenshot scrolls, which would draw the sticky page title
  // over the top of the preview
  await visualAdminPage.addStyleTag({ content: STATIC_HEADER });

  await expect(file).toHaveScreenshot('settlement-import-preview.png');
});

test('Visual: admin clean settlement import', async ({ visualAdminPage }) => {
  // One record asks for a confirmation, which holds the clean import back
  const [file] = PREVIEW.files;
  const pending: SettlementPreviewResponse = {
    removals: 3,
    files: [
      {
        ...file,
        records: [
          {
            ...file.records[0],
            printedOwner: 'Jan Testowy D',
            confirmations: ['owner-annotation'],
          },
        ],
      },
    ],
  };
  await visualAdminPage.route(
    '**/api/admin/import/settlements/preview',
    (route) => route.fulfill({ json: pending })
  );
  await visualAdminPage.goto('/admin/import');
  const option = visualAdminPage.getByRole('checkbox', {
    name: /^Czysty import rozliczeń/,
  });
  await waitForHydration(option);
  await option.click();
  await visualAdminPage
    .getByRole('button', { name: 'Rozumiem, dalej' })
    .click();
  await visualAdminPage
    .getByRole('button', { name: 'Potwierdzam – czysty import' })
    .click();
  await expect(option).toBeChecked();
  await visualAdminPage.locator(SETTLEMENT_INPUT_SELECTOR).setInputFiles({
    name: FILE_NAME,
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await visualAdminPage.getByRole('button', { name: 'Sprawdź pliki' }).click();
  await expect(
    visualAdminPage.getByRole('region', { name: 'Podgląd rozliczeń' })
  ).toBeVisible();
  await expectNoHorizontalOverflow(visualAdminPage);
  await visualAdminPage.addStyleTag({ content: STATIC_HEADER });
  // The whole card fits the window, so the element screenshot is not cut off
  const width = visualAdminPage.viewportSize()!.width;
  await visualAdminPage.setViewportSize({ width, height: TALL_VIEWPORT });

  const card = visualAdminPage.getByRole('region', {
    name: 'Import rozliczeń',
  });
  await expect(card).toHaveScreenshot('settlement-clean-import-pending.png');

  await card.getByRole('checkbox', { name: /z pliku to właściciel/ }).click();
  await expect(card.getByText(/Blokują go/)).toBeHidden();
  await expect(
    card.getByRole('button', { name: /z usunięciem danych/ })
  ).toBeEnabled();
  await visualAdminPage.mouse.move(0, 0);

  await expect(card).toHaveScreenshot('settlement-clean-import.png');
});
