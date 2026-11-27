/**
 * Database statistics on the admin import page: the summary is requested on
 * load, the per-association totals only after their section is opened, and
 * both the wide table and the narrow cards fit their screen
 */

import type { Locator, Page, Request } from '@playwright/test';

import { expect, test } from '../../fixtures';
import { TEST_HOA_NAME } from '../../utils/admin-apartments';
import { expectNoHorizontalOverflow } from '../../utils/expect-no-horizontal-overflow';

const STATS_PATH = '/api/admin/stats';
const ASSOCIATIONS_QUERY = '?associations=true';
const SECTION_TOGGLE = 'Według wspólnot';
const LAST_PERIOD_HEADER = 'Ostatni okres';
const WIDE_VIEWPORT = { width: 1280, height: 900 };
const PHONE_VIEWPORT = { width: 390, height: 844 };

/** Query strings of the statistics requests the page has made so far. */
function statsQueries(requests: Request[]) {
  return requests.map((request) => new URL(request.url()).search);
}

function trackStatsRequests(page: Page) {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === STATS_PATH) requests.push(request);
  });
  return requests;
}

async function openAssociations(page: Page) {
  const toggle = page.getByRole('button', { name: SECTION_TOGGLE });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
}

/** A scroll container is wide enough for its content, so nothing is cut off. */
async function expectNoScrollInside(container: Locator) {
  const fits = await container.evaluate(
    (element) => element.scrollWidth <= element.clientWidth
  );
  expect(fits).toBe(true);
}

test.describe('Admin database statistics on a wide screen', () => {
  test.use({ viewport: WIDE_VIEWPORT });

  test('the association table shows every column without scrolling', async ({
    adminPage,
  }) => {
    const statsRequests = trackStatsRequests(adminPage);

    await adminPage.goto('/admin/import');
    await expect(
      adminPage.getByRole('columnheader', { name: 'Ostatnia zmiana' })
    ).toBeVisible();
    expect(statsQueries(statsRequests)).toEqual(['']);
    await expect(
      adminPage.getByRole('columnheader', { name: LAST_PERIOD_HEADER })
    ).toBeHidden();

    await openAssociations(adminPage);
    await expect(
      adminPage.getByRole('columnheader', { name: LAST_PERIOD_HEADER })
    ).toBeVisible();
    expect(statsQueries(statsRequests)).toEqual(['', ASSOCIATIONS_QUERY]);

    const header = adminPage.getByRole('columnheader', {
      name: LAST_PERIOD_HEADER,
    });
    await expect(header).toBeVisible();
    const table = header.locator('xpath=ancestor::table');
    await expectNoScrollInside(table.locator('xpath=..'));
    await expect(
      adminPage.getByRole('row').filter({ hasText: TEST_HOA_NAME })
    ).toBeVisible();
    await expectNoHorizontalOverflow(adminPage);
  });
});

test.describe('Admin database statistics on a phone', () => {
  test.use({ viewport: PHONE_VIEWPORT });

  test('every association value is readable in its card', async ({
    adminPage,
  }) => {
    const statsRequests = trackStatsRequests(adminPage);

    await adminPage.goto('/admin/import');
    await openAssociations(adminPage);

    const card = adminPage
      .getByRole('listitem')
      .filter({ hasText: TEST_HOA_NAME })
      .first();
    await expect(card).toBeVisible();
    expect(statsQueries(statsRequests)).toEqual(['', ASSOCIATIONS_QUERY]);
    await expect(card.getByText(LAST_PERIOD_HEADER)).toBeVisible();
    await expect(adminPage.getByRole('table')).toHaveCount(0);
    await expectNoHorizontalOverflow(adminPage);
  });
});
