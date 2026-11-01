/**
 * E2E tests that tenant views end on the current month.
 */

import { expect, login, test } from '../fixtures';
import { createMixedPaymentsUser } from '../utils/create-mixed-payments-user';
import { POLISH_MONTHS } from '../utils/date-utils';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';
import { insertChargesForPeriod } from '../utils/insert-charges-for-period';
import { USER_PASSWORD } from '../utils/test-credentials';

// Charge records exist for January (seeded), the current month and the next one
const JANUARY_INDEX = 0;

test.describe.serial('Charge cutoff', () => {
  let email: string;
  let year: number;
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  test.beforeEach(async () => {
    const seed = await createMixedPaymentsUser();
    email = seed.email;
    year = seed.year;
    await insertChargesForPeriod(seed.apartmentId, year, now.getMonth());
    await insertChargesForPeriod(seed.apartmentId, year, now.getMonth() + 1);
  });

  test.afterEach(async () => {
    await deleteUserAndApartmentsByEmail(email);
  });

  test('dashboard and charges list end on the current month', async ({
    page,
  }) => {
    const current = `${POLISH_MONTHS[now.getMonth()]} ${year}`;
    const future = `${POLISH_MONTHS[next.getMonth()]} ${next.getFullYear()}`;
    const january = `${POLISH_MONTHS[JANUARY_INDEX]} ${year}`;

    await login(page, email, USER_PASSWORD);

    await expect(
      page.getByText(current, { exact: true }).first()
    ).toBeVisible();
    await expect(page.getByText(future, { exact: true })).toHaveCount(0);

    await page.goto('/dashboard/charges');
    await expect(
      page.getByRole('button').filter({ hasText: current }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button').filter({ hasText: january }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button').filter({ hasText: future })
    ).toHaveCount(0);
  });
});
