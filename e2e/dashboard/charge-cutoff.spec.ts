/**
 * E2E tests that tenant views end on the latest month charged in payments.
 */

import { expect, login, test } from '../fixtures';
import { createMixedPaymentsUser } from '../utils/create-mixed-payments-user';
import { POLISH_MONTHS } from '../utils/date-utils';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';
import { insertChargesForPeriod } from '../utils/insert-charges-for-period';
import { USER_PASSWORD } from '../utils/test-credentials';

// Payments charge May and July; charge records exist for January (seeded),
// July and August (inserted)
const JANUARY_INDEX = 0;
const JULY_INDEX = 6;
const AUGUST_INDEX = 7;

test.describe.serial('Charge cutoff', () => {
  let email: string;
  let year: number;

  // eslint-disable-next-line playwright/no-skipped-test -- calendar dependent
  test.skip(
    new Date().getMonth() < JULY_INDEX,
    'The cutoff month must not be in the future'
  );

  test.beforeEach(async () => {
    const seed = await createMixedPaymentsUser();
    email = seed.email;
    year = seed.year;
    await insertChargesForPeriod(seed.apartmentId, year, JULY_INDEX);
    await insertChargesForPeriod(seed.apartmentId, year, AUGUST_INDEX);
  });

  test.afterEach(async () => {
    await deleteUserAndApartmentsByEmail(email);
  });

  test('dashboard and charges list end on the latest charged month', async ({
    page,
  }) => {
    const july = `${POLISH_MONTHS[JULY_INDEX]} ${year}`;
    const august = `${POLISH_MONTHS[AUGUST_INDEX]} ${year}`;
    const january = `${POLISH_MONTHS[JANUARY_INDEX]} ${year}`;

    await login(page, email, USER_PASSWORD);

    await expect(page.getByText(july, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(august, { exact: true })).toHaveCount(0);

    await page.goto('/dashboard/charges');
    await expect(
      page.getByRole('button').filter({ hasText: july }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button').filter({ hasText: january }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('button').filter({ hasText: august })
    ).toHaveCount(0);
  });
});
