/**
 * Enabling clean import on the import page asks for two warnings.
 */

import { expect, test } from '../fixtures';

test.describe('Clean import warnings', () => {
  test('rejecting the warning keeps clean import disabled', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByLabel(/czysty import/i).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toContainText('Ostrzeżenie – czysty import');
    await dialog.getByRole('button', { name: 'Anuluj', exact: true }).click();

    await expect(dialog).toBeHidden();
    await expect(adminPage.getByLabel(/czysty import/i)).not.toBeChecked();
  });

  test('clean import is enabled only after both warnings are confirmed', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByLabel(/czysty import/i).click();

    const dialog = adminPage.getByRole('dialog');
    await expect(dialog).toContainText('Ostrzeżenie – czysty import');
    await dialog.getByRole('button', { name: 'Rozumiem, dalej' }).click();

    await expect(dialog).toContainText('Potwierdzenie – czysty import');
    await dialog
      .getByRole('button', { name: 'Potwierdzam – czysty import' })
      .click();

    await expect(dialog).toBeHidden();
    await expect(adminPage.getByLabel(/czysty import/i)).toBeChecked();
  });
});
