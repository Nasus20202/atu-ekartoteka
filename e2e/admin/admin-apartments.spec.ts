/**
 * Admin HOA apartments list tests
 */

import { expect, test } from '../fixtures';
import {
  cardWithText,
  openHoaApartments,
  searchApartments,
  SEEDED_APARTMENT_LABEL,
} from '../utils/admin-apartments';
import { createTwinUnassignedApartment } from '../utils/create-twin-unassigned-apartment';
import { deleteApartment } from '../utils/delete-apartment';

test.describe('Admin apartments list', () => {
  test('admin can view apartments in HOA', async ({ adminPage }) => {
    await openHoaApartments(adminPage);

    await expect(adminPage.getByText(SEEDED_APARTMENT_LABEL)).toBeVisible();
  });

  test('apartment list shows owner info', async ({ adminPage }) => {
    await openHoaApartments(adminPage);

    await expect(adminPage.getByText(/E2E Test User/i)).toBeVisible();
  });

  test('apartment list shows address and external ID', async ({
    adminPage,
  }) => {
    await openHoaApartments(adminPage);

    const apartmentCard = cardWithText(adminPage, SEEDED_APARTMENT_LABEL);
    await expect(apartmentCard.getByText(SEEDED_APARTMENT_LABEL)).toBeVisible();
    await expect(apartmentCard.getByText(/Warszawa/i)).toBeVisible();
    await expect(adminPage.getByText(/W00001/i)).toBeVisible();
  });

  test('admin can navigate back to HOA list', async ({ adminPage }) => {
    await openHoaApartments(adminPage);

    await adminPage.goBack();

    await expect(adminPage).toHaveURL(/\/admin\/apartments$/);
  });

  test('searching "1/1A" filters apartments by building and number', async ({
    adminPage,
  }) => {
    await openHoaApartments(adminPage);

    // "1/1A" splits on "/" into building=1, number=1A
    await searchApartments(adminPage, '1/1A');

    await expect(
      adminPage.getByText(SEEDED_APARTMENT_LABEL).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('searching a non-matching term shows empty state', async ({
    adminPage,
  }) => {
    await openHoaApartments(adminPage);

    await searchApartments(adminPage, 'ZZZNOMATCH999');

    await expect(adminPage.getByText(/Nie znaleziono mieszkań/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows "Duplikat adresu" badge when two active apartments share the same address', async ({
    adminPage,
  }) => {
    // A second apartment with the same building/number as the seeded one
    const { id: twinId } = await createTwinUnassignedApartment();

    try {
      await openHoaApartments(adminPage);

      await expect(adminPage.getByText('Duplikat adresu').first()).toBeVisible({
        timeout: 5000,
      });
    } finally {
      await deleteApartment(twinId);
    }
  });
});
