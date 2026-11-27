/** The tenant's settlements page. */

import type { Page } from '@playwright/test';

import { expect, login, test } from '../fixtures';
import { openNavigationMenu } from '../utils/navigation';
import {
  createSettlementTenant,
  deleteSettlementTenant,
  type SettlementTenant,
} from '../utils/settlement-tenant';
import { E2E_PASSWORD } from '../utils/test-credentials';
import { TIMEZONE_ID } from '../utils/timezone';

const PAGE = '/dashboard/settlements';
const NOT_FOUND = 'Rozliczenie nie znalezione';

test.describe('Tenant settlements', () => {
  let tenant: SettlementTenant;

  test.beforeAll(async () => {
    tenant = await createSettlementTenant();
  });

  test.afterAll(async () => {
    await deleteSettlementTenant(tenant);
  });

  async function signedIn(page: Page) {
    await login(page, tenant.email, E2E_PASSWORD);
    return page;
  }

  test('reads each view from the navbar link', async ({ page }) => {
    await signedIn(page);
    const link = page
      .getByRole('navigation')
      .getByRole('link', { name: 'Rozliczenia' })
      .filter({ visible: true });

    await openNavigationMenu(page);
    await link.click();

    await expect(page).toHaveURL(`${PAGE}/${tenant.ownId}`);
    // Answered by the server, not left to a page that redirects after loading
    const section = await page.request.get(PAGE, { maxRedirects: 0 });
    expect(section.status()).toBe(307);
    expect(section.headers().location).toBe(`${PAGE}/${tenant.ownId}`);
    await openNavigationMenu(page);
    await expect(link).toHaveAttribute('aria-current', 'page');
    await expect(page).toHaveTitle('Rozliczenia | ATU Ekartoteka');
    const banner = page.getByRole('region', {
      name: 'Wynik rozliczenia mediów',
    });
    await expect(banner).toContainText('Nadpłata za media');
    await expect(banner).toContainText('287,80 zł');

    const card = page.getByRole('region', { name: 'Ciepła woda (CW)' });
    await expect(card).toContainText(
      'Licznik nr 1000102, odczyty: 120,400 → 134,600 m³'
    );
    await card.getByRole('button', { name: 'Szczegóły' }).click();
    await expect(card.getByRole('row')).toHaveCount(5);

    await page.getByRole('tab', { name: 'Liczniki' }).click();
    // Two visible periods with three meters each
    await expect(
      page.getByRole('table', { name: 'Odczyty' }).getByRole('row')
    ).toHaveCount(7);

    await page.getByRole('tab', { name: 'Koszty rzeczywiste' }).click();
    await expect(
      page.getByRole('region', { name: 'Suma rozliczenia rocznego' })
    ).toContainText(`Suma: nadpłata za ${tenant.year - 1} rok`);
  });

  test('downloads the PDF of each view', async ({ page }) => {
    await signedIn(page);
    await page.goto(PAGE);
    // The browser names the file with its own date, not the one of the runner
    const today = new Date().toLocaleDateString('sv-SE', {
      timeZone: TIMEZONE_ID,
    });

    for (const [tab, fileName] of [
      [
        'Media',
        `rozliczenie-mediow-.*-${tenant.year}-05-01-${tenant.year}-09-30`,
      ],
      ['Liczniki', `liczniki-.*-${today}`],
      [
        'Koszty rzeczywiste',
        `koszty-rzeczywiste-.*-${tenant.year - 1}-01-01-${tenant.year - 1}-12-31`,
      ],
    ]) {
      await page.getByRole('tab', { name: tab }).click();
      const download = page.waitForEvent('download');
      await page
        .getByRole('button', { name: 'Pobierz PDF', exact: true })
        .click();

      expect((await download).suggestedFilename()).toMatch(
        new RegExp(`^${fileName}\\.pdf$`)
      );
    }
  });

  test('filters and sorts the table of readings', async ({ page }) => {
    await signedIn(page);
    await page.goto(PAGE);
    await page.getByRole('tab', { name: 'Liczniki' }).click();
    const table = page.getByRole('table', { name: 'Odczyty' });

    await page.getByRole('button', { name: 'Licznik', exact: true }).click();
    await page
      .getByRole('menuitemradio', { name: 'Ciepła woda (CW 01)' })
      .click();

    // One meter in each of the two visible periods
    await expect(table.getByRole('row')).toHaveCount(3);
    await expect(page).toHaveURL(/meter=CW(\+|%20)01/);

    await table.getByRole('button', { name: 'Data końc.' }).click();

    await expect(
      table.getByRole('columnheader', { name: 'Data końc.' })
    ).toHaveAttribute('aria-sort', 'ascending');
    await expect(table.getByRole('row').nth(1)).toContainText(
      `30.09.${tenant.year - 1}`
    );
    await expect(page).toHaveURL(/readingSort=endDate&readingOrder=asc/);

    await page.reload();

    await expect(page.getByRole('tab', { name: 'Liczniki' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    await expect(table.getByRole('row')).toHaveCount(3);
  });

  test('selects a period and keeps hidden ones out', async ({ page }) => {
    await signedIn(page);
    await page.goto(PAGE);

    await page.getByRole('button', { name: 'Okres' }).click();
    await expect(page.getByRole('menuitemradio')).toHaveCount(2);
    await page
      .getByRole('menuitemradio', {
        name: `01.05 – 30.09.${tenant.year - 1}`,
      })
      .click();

    await expect(page).toHaveURL(
      new RegExp(`${tenant.ownId}\\?period=${tenant.ownUtilityIds[1]}`)
    );
    await expect(page.getByRole('button', { name: 'Okres' })).toContainText(
      `30.09.${tenant.year - 1}`
    );
    // One apartment needs no selector, and the document details are not shown
    await expect(page.getByRole('button', { name: 'Lokal' })).toHaveCount(0);
    await expect(page.getByLabel('Dane dokumentu')).toHaveCount(0);
    await expect(page.getByText(`${tenant.hiddenYear}`)).toHaveCount(0);
  });

  test('does not open a hidden period', async ({ page }) => {
    await signedIn(page);

    await page.goto(
      `${PAGE}/${tenant.ownId}?period=${tenant.ownUtilityIds[2]}`
    );

    await expect(page.getByRole('heading', { name: NOT_FOUND })).toBeVisible();
  });

  test('does not open the apartment or record of someone else', async ({
    page,
  }) => {
    await signedIn(page);

    for (const path of [
      tenant.foreignId,
      `${tenant.ownId}?period=${tenant.foreignUtilityId}`,
    ]) {
      await page.goto(`${PAGE}/${path}`);

      await expect(
        page.getByRole('heading', { name: NOT_FOUND })
      ).toBeVisible();
      await expect(page.getByText('Lokator 2')).toHaveCount(0);
    }
  });

  test('sends a signed-out visitor to the login page', async ({ page }) => {
    await page.goto(PAGE);

    await expect(page).toHaveURL(/\/login/);
  });
});
