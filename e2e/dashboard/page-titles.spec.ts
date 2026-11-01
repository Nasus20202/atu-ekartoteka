/**
 * Browser document titles for tenant pages. The apartment address appears
 * in a title only for the apartment owner.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { SEEDED_APARTMENT_LABEL } from '../utils/admin-apartments';
import { createUnassignedApartment } from '../utils/create-unassigned-apartment';

const CURRENT_YEAR = new Date().getFullYear();
const CHARGES_LINK = /^\/dashboard\/charges\/([^/?#]+)/;
const UNKNOWN_APARTMENT_ID = '00000000-0000-4000-8000-000000000000';
const GENERIC_CHARGES_TITLE = 'Naliczenia mieszkania | ATU Ekartoteka';

/** Reads the id of the signed-in user's apartment from the dashboard. */
async function openOwnedApartmentId(page: Page): Promise<string> {
  await page.goto('/dashboard');
  const href = await page
    .locator('a[href^="/dashboard/charges/"]')
    .first()
    .getAttribute('href');
  const id = href?.match(CHARGES_LINK)?.[1];
  if (!id) throw new Error('Owned apartment link not found on the dashboard');
  return id;
}

test.describe('Tenant page titles', () => {
  test('dashboard home uses the app name', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    await expect(userPage).toHaveTitle('ATU Ekartoteka');
  });

  test('profile page has its own title', async ({ userPage }) => {
    await userPage.goto('/dashboard/profile');

    await expect(userPage).toHaveTitle('Profil | ATU Ekartoteka');
  });

  test('charges list and payments list have their own titles', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/charges');
    await expect(userPage).toHaveTitle('Naliczenia | ATU Ekartoteka');

    await userPage.goto('/dashboard/payments');
    await expect(userPage).toHaveTitle('Wpłaty | ATU Ekartoteka');
  });

  test('owner sees the address in the charges title', async ({ userPage }) => {
    const apartmentId = await openOwnedApartmentId(userPage);

    await userPage.goto(`/dashboard/charges/${apartmentId}`);

    await expect(userPage).toHaveTitle(
      `Naliczenia - ${SEEDED_APARTMENT_LABEL} | ATU Ekartoteka`
    );
  });

  test('owner sees the address in the payments year title', async ({
    userPage,
  }) => {
    const apartmentId = await openOwnedApartmentId(userPage);

    await userPage.goto(`/dashboard/payments/${apartmentId}/${CURRENT_YEAR}`);

    await expect(userPage).toHaveTitle(
      `Wpłaty ${CURRENT_YEAR} - ${SEEDED_APARTMENT_LABEL} | ATU Ekartoteka`
    );
  });

  test('address is not in the title of an apartment the user does not own', async ({
    userPage,
  }) => {
    const apartmentId = await createUnassignedApartment();

    await userPage.goto(`/dashboard/charges/${apartmentId}`);

    await expect(
      userPage.getByRole('heading', { name: 'Mieszkanie nie znalezione' })
    ).toBeVisible();
    await expect(userPage).toHaveTitle(GENERIC_CHARGES_TITLE);
  });

  test('unknown apartment uses the generic charges title', async ({
    userPage,
  }) => {
    await userPage.goto(`/dashboard/charges/${UNKNOWN_APARTMENT_ID}`);

    await expect(userPage).toHaveTitle(GENERIC_CHARGES_TITLE);
  });

  test('invalid payment year uses the generic payments title', async ({
    userPage,
  }) => {
    const apartmentId = await openOwnedApartmentId(userPage);

    await userPage.goto(`/dashboard/payments/${apartmentId}/abc`);

    await expect(userPage).toHaveTitle('Wpłaty mieszkania | ATU Ekartoteka');
  });

  test('unknown route uses the not-found title', async ({ userPage }) => {
    await userPage.goto(`/dashboard/no-such-page-${CURRENT_YEAR}`);

    await expect(userPage).toHaveTitle(
      'Strona nie znaleziona | ATU Ekartoteka'
    );
  });
});
