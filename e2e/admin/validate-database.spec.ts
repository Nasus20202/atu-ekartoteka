/**
 * Admin on-demand validation of the data stored in the database.
 */

import { expect, test } from '../fixtures';

test.describe('Database validation', () => {
  test('admin can validate stored data from the import page', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    // Either outcome proves the checks ran: a clean database or per-HOA findings
    await expect(
      adminPage
        .getByText(/nie znaleziono błędów ani ostrzeżeń/)
        .or(adminPage.getByRole('button', { name: /^Wspólnota:/ }).first())
    ).toBeVisible();
  });

  test('validation shows the result banner and the year balance grid', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    await expect(
      adminPage.getByText(
        /Walidacja (zakończona pomyślnie|z uwagami|nie powiodła się)/
      )
    ).toBeVisible();
    await expect(
      adminPage.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeVisible();
  });

  test('skipping the full validation shows the balance table only', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByLabel('Pomiń pełną walidację').check();
    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    await expect(
      adminPage.getByText(/Pełna walidacja pominięta/)
    ).toBeVisible();
    await expect(
      adminPage.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeVisible();
  });

  test('clicking a balance value shows the apartment records of that year', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();
    await adminPage.getByRole('table').getByRole('button').first().click();

    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await adminPage.keyboard.press('Escape');
    await expect(adminPage.getByRole('dialog')).toBeHidden();
  });
});
