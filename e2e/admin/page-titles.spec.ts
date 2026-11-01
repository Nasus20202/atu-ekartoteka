/**
 * Browser document titles for admin pages. HOA and apartment names are
 * shown in the title for admins.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import {
  openHoaApartments,
  openHoaList,
  openSeededApartmentDetails,
} from '../utils/admin-apartments';

const TEST_HOA_NAME = 'Test HOA';
const HOA_PATH = /\/admin\/apartments\/([^/?#]+)$/;
const UNKNOWN_APARTMENT_ID = '00000000-0000-4000-8000-000000000000';

/** Reads the HOA id from the current apartments URL. */
function hoaIdFromUrl(page: Page): string {
  const id = new URL(page.url()).pathname.match(HOA_PATH)?.[1];
  if (!id) throw new Error(`No HOA id in ${page.url()}`);
  return id;
}

test.describe('Admin page titles', () => {
  test('HOA list has its own title', async ({ adminPage }) => {
    await openHoaList(adminPage);

    await expect(adminPage).toHaveTitle(
      'Wspólnoty mieszkaniowe | ATU Ekartoteka'
    );
  });

  test('HOA apartments page uses the HOA name', async ({ adminPage }) => {
    await openHoaApartments(adminPage);

    await expect(adminPage).toHaveTitle(`${TEST_HOA_NAME} | ATU Ekartoteka`);
  });

  test('apartment page uses the number and HOA name', async ({ adminPage }) => {
    await openSeededApartmentDetails(adminPage);

    await expect(adminPage).toHaveTitle(
      `Lokal 1A - ${TEST_HOA_NAME} | ATU Ekartoteka`
    );
  });

  test('unknown apartment uses the generic apartment title', async ({
    adminPage,
  }) => {
    await openHoaApartments(adminPage);
    const hoaId = hoaIdFromUrl(adminPage);

    await adminPage.goto(`/admin/apartments/${hoaId}/${UNKNOWN_APARTMENT_ID}`);

    await expect(adminPage).toHaveTitle('Lokal | ATU Ekartoteka');
  });

  test('nested account management page keeps the app name', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users/management');

    await expect(adminPage).toHaveTitle('Zarządzanie kontami | ATU Ekartoteka');
  });

  test('users, import and settings pages have their own titles', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/users');
    await expect(adminPage).toHaveTitle('Użytkownicy | ATU Ekartoteka');

    await adminPage.goto('/admin/import');
    await expect(adminPage).toHaveTitle('Import danych | ATU Ekartoteka');

    await adminPage.goto('/admin/settings');
    await expect(adminPage).toHaveTitle('Ustawienia | ATU Ekartoteka');
  });
});
