/**
 * Server-side sorting of the admin apartments table. The list is longer than
 * one API page, so the expected order can only come from the database.
 */

import type { Locator, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import {
  createScrollTestHoa,
  deleteScrollTestHoa,
} from '../utils/scroll-test-hoa';

const APARTMENT_COUNT = 45;
const LOAD_TIMEOUT_MS = 10000;

const ownerColumn = (page: Page) => page.locator('tbody tr td:nth-child(2)');
const shareColumn = (page: Page) => page.locator('tbody tr td:nth-child(3)');
const statusColumn = (page: Page) => page.locator('tbody tr td:nth-child(4)');

/** Same formatting as the table: 45/1000 -> "4.5%". */
function formatShare(numerator: number, denominator = 1000): string {
  const percent = ((numerator / denominator) * 100).toFixed(4);
  return `${percent.replace(/\.?0+$/, '')}%`;
}

function descendingNumbers(): number[] {
  return Array.from({ length: APARTMENT_COUNT }, (_, i) => APARTMENT_COUNT - i);
}

function sortRequest(page: Page, sort: string, order: 'asc' | 'desc') {
  return page.waitForRequest(
    (request) =>
      request.url().includes('/api/admin/apartments?') &&
      request.url().includes(`sort=${sort}`) &&
      request.url().includes(`order=${order}`)
  );
}

async function sortBy(
  page: Page,
  header: string,
  sort: string,
  clicks: number,
  firstText: string,
  column: Locator
) {
  for (let click = 1; click <= clicks; click += 1) {
    const order = click % 2 === 1 ? 'asc' : 'desc';
    const request = sortRequest(page, sort, order);
    await page.getByRole('button', { name: header }).click();
    await request;
  }
  await expect(column.first()).toHaveText(firstText);
}

async function loadAllRows(page: Page, column: Locator) {
  await expect(async () => {
    await page.mouse.wheel(0, 20000);
    await expect(column).toHaveCount(APARTMENT_COUNT, { timeout: 1000 });
  }).toPass({ timeout: LOAD_TIMEOUT_MS });
}

/** Opens the list in table view (the view choice is remembered) at page one. */
async function openApartmentTable(page: Page, hoaId: string) {
  await page.goto(`/admin/apartments/${hoaId}`);
  await expect(
    page.getByText(`Znaleziono ${APARTMENT_COUNT} mieszkań`)
  ).toBeVisible({ timeout: LOAD_TIMEOUT_MS });

  const tableButton = page.getByRole('button', { name: 'Tabela' });
  if ((await tableButton.getAttribute('aria-pressed')) !== 'true') {
    await tableButton.click();
  }
  await expect(page.getByRole('columnheader', { name: 'Adres' })).toBeVisible({
    timeout: LOAD_TIMEOUT_MS,
  });
  await expect(ownerColumn(page).first()).toBeVisible();
}

test.describe('Admin apartments table sorting', () => {
  let hoaId: string;

  test.beforeAll(async () => {
    hoaId = await createScrollTestHoa(APARTMENT_COUNT);
  });

  test.afterAll(async () => {
    await deleteScrollTestHoa(hoaId);
  });

  test('sorts owner, share and status on the server across every page', async ({
    adminPage,
  }) => {
    await openApartmentTable(adminPage, hoaId);

    // Owner: Polish numeric collation, so 45..2 before 1 even across pages
    await sortBy(
      adminPage,
      'Właściciel',
      'owner',
      2,
      `Scroll Owner ${APARTMENT_COUNT}`,
      ownerColumn(adminPage)
    );
    await loadAllRows(adminPage, ownerColumn(adminPage));
    await expect(ownerColumn(adminPage)).toHaveText(
      descendingNumbers().map((n) => `Scroll Owner ${n}`)
    );

    // Share: ordered by the numerator (the denominator is constant per HOA)
    await openApartmentTable(adminPage, hoaId);
    await sortBy(
      adminPage,
      'Udział',
      'share',
      2,
      formatShare(APARTMENT_COUNT),
      shareColumn(adminPage)
    );
    await loadAllRows(adminPage, shareColumn(adminPage));
    await expect(shareColumn(adminPage)).toHaveText(
      descendingNumbers().map((n) => formatShare(n))
    );

    // Status: descending puts the inactive apartments (every fifth) first
    await openApartmentTable(adminPage, hoaId);
    await sortBy(
      adminPage,
      'Status',
      'status',
      2,
      'Nieaktywne',
      statusColumn(adminPage)
    );
    await loadAllRows(adminPage, statusColumn(adminPage));
    const expectedStatuses = [
      ...Array.from({ length: APARTMENT_COUNT / 5 }, () => 'Nieaktywne'),
      ...Array.from(
        { length: APARTMENT_COUNT - APARTMENT_COUNT / 5 },
        () => 'Aktywne'
      ),
    ];
    await expect(statusColumn(adminPage)).toHaveText(expectedStatuses);
  });
});
