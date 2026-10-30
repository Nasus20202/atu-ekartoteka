/**
 * Infinite scrolling of a HOA apartments list
 */

import { expect, test } from '../fixtures';
import {
  createScrollTestHoa,
  deleteScrollTestHoa,
} from '../utils/scroll-test-hoa';

const APARTMENT_COUNT = 45;
const LOAD_TIMEOUT_MS = 10000;

test.describe('Admin apartments infinite scroll', () => {
  let hoaId: string;

  test.beforeAll(async () => {
    hoaId = await createScrollTestHoa(APARTMENT_COUNT);
  });

  test.afterAll(async () => {
    await deleteScrollTestHoa(hoaId);
  });

  test('scrolling loads every apartment without page controls', async ({
    adminPage,
  }) => {
    await adminPage.goto(`/admin/apartments/${hoaId}?page=2`);
    await expect(
      adminPage.getByText(`Znaleziono ${APARTMENT_COUNT} mieszkań`)
    ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

    // The legacy page parameter is ignored: the list starts at the top
    await expect(
      adminPage.getByText('ul. Przewijana 1/1', { exact: true })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: /Następna|Poprzednia/ })
    ).toHaveCount(0);

    const cards = adminPage.getByRole('button', { name: 'Zobacz szczegóły' });
    await expect(async () => {
      await adminPage.mouse.wheel(0, 10000);
      await expect(cards).toHaveCount(APARTMENT_COUNT, { timeout: 1000 });
    }).toPass({ timeout: LOAD_TIMEOUT_MS });

    await expect(
      adminPage.getByText(`ul. Przewijana 1/${APARTMENT_COUNT}`, {
        exact: true,
      })
    ).toHaveCount(1);
    await expect(
      adminPage.getByRole('button', { name: 'Pokaż więcej' })
    ).toHaveCount(0);
  });

  test('searching restarts the list', async ({ adminPage }) => {
    await adminPage.goto(`/admin/apartments/${hoaId}`);
    await expect(
      adminPage.getByText(`Znaleziono ${APARTMENT_COUNT} mieszkań`)
    ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

    await adminPage.getByPlaceholder('Wyszukaj...').fill('Scroll Owner 44');
    await adminPage.getByRole('button', { name: /Szukaj/i }).click();

    await expect(adminPage.getByText('Znaleziono 1 mieszkanie')).toBeVisible({
      timeout: LOAD_TIMEOUT_MS,
    });
    await expect(
      adminPage.getByRole('button', { name: 'Zobacz szczegóły' })
    ).toHaveCount(1);
  });
});
