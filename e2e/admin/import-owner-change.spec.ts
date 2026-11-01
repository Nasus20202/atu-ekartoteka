import type { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

import { expect, test } from '../fixtures';
import { deleteHoaByExternalId, readOwnerRows } from '../utils/owner-validity';

const OWNER_VALIDITY_HOA = 'TEST06';

async function importFolder(adminPage: Page, folder: string) {
  const importDir = fileURLToPath(
    new URL(`../test-data/import/${folder}`, import.meta.url)
  );
  const filePayloads = fs.readdirSync(importDir).map((name) => ({
    name: `${folder}/${name}`,
    mimeType: 'text/plain',
    buffer: fs.readFileSync(path.join(importDir, name)),
  }));

  await adminPage.goto('/admin/import');

  await adminPage.evaluate(() => {
    const input = document.querySelector('input[type="file"]');
    input?.removeAttribute('webkitdirectory');
    input?.removeAttribute('directory');
  });

  await adminPage.locator('input[type="file"]').setInputFiles(filePayloads);

  await Promise.all([
    adminPage.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/import') && resp.status() === 200,
      { timeout: 30000 }
    ),
    adminPage.getByRole('button', { name: /^Importuj$/i }).click(),
  ]);
}

test.describe('Admin Import Owner Change', () => {
  test.afterAll(async () => {
    await deleteHoaByExternalId(OWNER_VALIDITY_HOA);
  });

  test('import with a former-owner wplaty row passes cross-file validation', async ({
    adminPage,
  }) => {
    // TEST05 wplaty has a former-owner balance-transfer row without charges
    // next to the current owner's row; nal_czynsz lists only the current owner.
    await importFolder(adminPage, 'TEST05');

    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText(/Wspólnoty z błędami/i)).toHaveCount(0);
    await expect(adminPage.getByText(/naliczenia z wpłat/i)).toHaveCount(0);

    // The former owner and the lease are not imported, so their rows are
    // reported as skipped
    await expect(adminPage.getByText(/Ostrzeżenia \(2\)/i)).toBeVisible();
    await expect(
      adminPage.getByText(
        'Pominięto 1 wpłatę dla W20001: brak właściciela w lok.txt i w bazie',
        { exact: false }
      )
    ).toBeVisible();
    await expect(
      adminPage.getByText(
        /Lokal TEST05-00000-00000-STELES: Pominięto 1 naliczenie, 1 wpłatę dla N20003: identyfikator nie oznacza właściciela/
      )
    ).toBeVisible();
  });

  test('import marks the former owner inactive and shows the current owner start date', async ({
    adminPage,
  }) => {
    // TEST06 lok.txt: the former owner ended on 2020-01-31 and the current
    // owner of the same apartment started on 2020-02-01
    await importFolder(adminPage, OWNER_VALIDITY_HOA);

    await expect(
      adminPage.getByText(/Import zakończony pomyślnie/i)
    ).toBeVisible({ timeout: 15000 });

    const rows = await readOwnerRows(OWNER_VALIDITY_HOA);
    const former = rows.find((r) => r.externalOwnerId === 'W60001');
    const current = rows.find((r) => r.externalOwnerId === 'W60002');
    expect(former?.isActive).toBe(false);
    expect(current?.isActive).toBe(true);
    expect(current?.validFrom?.toISOString()).toBe('2020-02-01T00:00:00.000Z');

    await adminPage.goto(
      `/admin/apartments/${current?.homeownersAssociationId}/${current?.id}`
    );
    await expect(
      adminPage
        .getByText('Właściciel od', { exact: true })
        .locator('xpath=following-sibling::p[1]')
    ).toHaveText('01.02.2020');
  });
});
