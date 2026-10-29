import { expect, type Page } from '@playwright/test';

export const TEST_HOA = 'TEST01';
export const SEEDED_APARTMENT_LABEL = 'ul. Testowa 1/1A';

const HOA_APARTMENTS_URL = /\/admin\/apartments\/[a-f0-9-]+$/;
const NAVIGATION_TIMEOUT_MS = 10000;

export function cardWithText(page: Page, text: string) {
  return page.locator('.text-card-foreground').filter({ hasText: text });
}

/** Opens the admin HOA list and waits for the seeded HOA. */
export async function openHoaList(page: Page) {
  await page.goto('/admin/apartments');
  await expect(page.getByText(TEST_HOA)).toBeVisible();
}

/** Opens the apartments list of the seeded HOA. */
export async function openHoaApartments(page: Page) {
  await openHoaList(page);
  await cardWithText(page, TEST_HOA)
    .getByRole('button', { name: /Zobacz mieszkania/i })
    .click();
  await page.waitForURL(HOA_APARTMENTS_URL, {
    timeout: NAVIGATION_TIMEOUT_MS,
  });
}

/** Opens the details page of the seeded apartment. */
export async function openSeededApartmentDetails(page: Page) {
  await openHoaApartments(page);
  await cardWithText(page, SEEDED_APARTMENT_LABEL)
    .getByRole('button', { name: /Zobacz szczegóły/i })
    .click();
}

/** Searches the HOA apartments list and waits for the response. */
export async function searchApartments(page: Page, term: string) {
  await page.getByPlaceholder('Wyszukaj...').fill(term);
  const searchParam = encodeURIComponent(term.split('/')[0]);
  await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/admin/apartments') &&
        resp.url().includes(`search=${searchParam}`) &&
        resp.status() === 200
    ),
    page.getByRole('button', { name: /Szukaj/i }).click(),
  ]);
}
