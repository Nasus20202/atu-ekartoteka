/**
 * E2E tests for hiding empty months on payment details.
 */

import { expect, test } from './fixtures';
import { createMixedPaymentsUser } from './utils/create-mixed-payments-user';
import { deleteUserAndApartmentsByEmail } from './utils/delete-user-and-apartments-by-email';
import { USER_PASSWORD } from './utils/test-credentials';

test.describe.serial('Payments Empty Months', () => {
  let email: string;
  let year: number;

  test.beforeEach(async () => {
    const seed = await createMixedPaymentsUser();
    email = seed.email;
    year = seed.year;
  });

  test.afterEach(async () => {
    await deleteUserAndApartmentsByEmail(email);
  });

  test('tenant sees only non-empty months while yearly totals stay exact', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Hasło', { exact: true }).fill(USER_PASSWORD);
    await page
      .getByRole('button', { name: 'Zaloguj się', exact: true })
      .click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), {
      timeout: 10000,
    });

    await page.goto('/dashboard/payments');
    await expect(page.getByText('ul. Mieszana 9/9A')).toBeVisible();
    await expect(page.getByText(`Rok ${year}`)).toBeVisible();

    await page.getByText(`Rok ${year}`).click();
    await expect(page).toHaveURL(/\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/);

    await expect(page.getByText(/Styczeń/i).first()).toBeVisible();
    await expect(page.getByText(/Marzec/i).first()).toBeVisible();
    await expect(page.getByText(/Maj/i).first()).toBeVisible();
    await expect(page.getByText(/Lipiec/i).first()).toBeVisible();

    await expect(page.getByText(/Luty/i)).toHaveCount(0);
    await expect(page.getByText(/Kwiecień/i)).toHaveCount(0);
    await expect(page.getByText(/Czerwiec/i)).toHaveCount(0);

    await expect(page.getByText('124,94 zł').first()).toBeVisible();
    await expect(page.getByText('249,88 zł').first()).toBeVisible();
    await expect(page.getByText('-124,94 zł').first()).toBeVisible();
  });
});
