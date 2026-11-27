/** Charges and payments of an apartment are readable by its owner only. */

import { expect, login, test } from '../fixtures';
import {
  createNeighbourApartment,
  deleteNeighbourApartment,
  type NeighbourApartment,
} from '../utils/neighbour-apartment';
import { E2E_PASSWORD } from '../utils/test-credentials';

const CHARGES_NOT_FOUND = 'Naliczenia nie znalezione';
const PAYMENTS_NOT_FOUND = 'Wpłaty nie znalezione';
const PDF_BUTTON = { name: /Pobierz PDF/i };

test.describe('Apartment of another resident', () => {
  let neighbour: NeighbourApartment;

  test.beforeAll(async () => {
    neighbour = await createNeighbourApartment();
  });

  test.afterAll(async () => {
    await deleteNeighbourApartment(neighbour);
  });

  const pages = () => {
    const { apartmentId, monthParam, year } = neighbour;
    return [
      {
        url: `/dashboard/charges/${apartmentId}?month=${monthParam}`,
        notFound: CHARGES_NOT_FOUND,
      },
      {
        url: `/dashboard/payments/${apartmentId}/${year}`,
        notFound: PAYMENTS_NOT_FOUND,
      },
    ];
  };

  // Without this, the refusals below would also pass if nothing had been seeded
  test('opens for its owner, with the data and the PDF', async ({ page }) => {
    await login(page, neighbour.email, E2E_PASSWORD);

    for (const { url } of pages()) {
      await page.goto(url);

      await expect(page.getByText(neighbour.address).first()).toBeVisible();
      await expect(
        page.getByText(neighbour.chargeAmount).filter({ visible: true }).first()
      ).toBeVisible();
      await expect(page.getByRole('button', PDF_BUTTON).first()).toBeVisible();
    }
  });

  test('is not found for another tenant, who gets no PDF', async ({
    userPage,
  }) => {
    const list = {
      url: `/dashboard/charges/${neighbour.apartmentId}`,
      notFound: CHARGES_NOT_FOUND,
    };
    for (const { url, notFound } of [list, ...pages()]) {
      await userPage.goto(url);

      await expect(
        userPage.getByRole('heading', { name: notFound })
      ).toBeVisible();
      await expect(userPage.getByText(neighbour.address)).toHaveCount(0);
      await expect(userPage.getByText(neighbour.chargeAmount)).toHaveCount(0);
      await expect(userPage.getByRole('button', PDF_BUTTON)).toHaveCount(0);
    }
  });

  test('is missing from the lists of another tenant', async ({ userPage }) => {
    for (const url of [
      '/dashboard',
      '/dashboard/charges',
      '/dashboard/payments',
    ]) {
      await userPage.goto(url);

      await expect(userPage.getByRole('heading').first()).toBeVisible();
      await expect(userPage.getByText(neighbour.address)).toHaveCount(0);
      await expect(userPage.getByText(neighbour.chargeAmount)).toHaveCount(0);
    }
  });

  test('sends a signed-out visitor to the login page', async ({ page }) => {
    for (const { url } of pages()) {
      await page.goto(url);

      await expect(page).toHaveURL(/\/login/);
    }
  });
});
