/**
 * Switching payment years on the apartment payments page
 */

import { expect, login, test } from '../fixtures';
import { createMixedPaymentsUser } from '../utils/create-mixed-payments-user';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';
import { USER_PASSWORD } from '../utils/test-credentials';

test.describe('Payment Year Select', () => {
  let email: string;
  let year: number;

  test.beforeEach(async () => {
    const seed = await createMixedPaymentsUser({ yearsAgo: [1] });
    email = seed.email;
    year = seed.year;
  });

  test.afterEach(async () => {
    await deleteUserAndApartmentsByEmail(email);
  });

  test('tenant switches to the previous payment year', async ({ page }) => {
    await login(page, email, USER_PASSWORD);
    await page.goto('/dashboard/payments');
    await page.getByText(`Rok ${year}`).click();
    await expect(page).toHaveURL(
      new RegExp(`/dashboard/payments/[\\w-]+/${year}$`)
    );

    const yearSelect = page.getByRole('button', { name: 'Rok', exact: true });
    await expect(yearSelect).toHaveText(`Rok ${year}`);

    await yearSelect.click();
    await page.getByRole('menuitemradio', { name: `Rok ${year - 1}` }).click();

    await expect(page).toHaveURL(
      new RegExp(`/dashboard/payments/[\\w-]+/${year - 1}$`)
    );
    await expect(yearSelect).toHaveText(`Rok ${year - 1}`);
    await expect(
      page.getByText(`Szczegóły wpłat za rok ${year - 1}`)
    ).toBeVisible();
  });
});
