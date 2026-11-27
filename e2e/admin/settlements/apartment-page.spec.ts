/** Settlements on the admin apartment page: full history, admins only. */

import { expect, login, test } from '../../fixtures';
import {
  createSettlementTenant,
  deleteSettlementTenant,
  type SettlementTenant,
} from '../../utils/settlement-tenant';
import { E2E_PASSWORD } from '../../utils/test-credentials';

test.describe('Admin settlements', () => {
  let tenant: SettlementTenant;
  const pageOf = (apartmentId: string) =>
    `/admin/apartments/${tenant.hoaId}/${apartmentId}`;

  test.beforeAll(async () => {
    tenant = await createSettlementTenant();
  });

  test.afterAll(async () => {
    await deleteSettlementTenant(tenant);
  });

  test('reads the full history of an apartment', async ({ adminPage }) => {
    await adminPage.goto(pageOf(tenant.ownId));
    const card = adminPage.getByRole('region', {
      name: 'Rozliczenia',
      exact: true,
    });
    // The bar and the mobile menu mark the same link
    await expect(adminPage.locator('nav a[aria-current="page"]')).toHaveText([
      'Mieszkania',
      'Mieszkania',
    ]);

    await card.getByRole('button', { name: 'Okres' }).click();
    await expect(adminPage.getByRole('menuitemradio')).toHaveCount(3);
    await adminPage
      .getByRole('menuitemradio', {
        name: `01.05 – 30.09.${tenant.hiddenYear}`,
      })
      .click();

    await expect(card.getByLabel('Dane dokumentu')).toContainText(
      `media-${tenant.hiddenYear}.pdf`
    );
    await card.getByRole('tab', { name: 'Liczniki' }).click();
    // Three periods with three meters each
    await expect(
      card.getByRole('table', { name: 'Odczyty' }).getByRole('row')
    ).toHaveCount(10);
    await card.getByRole('tab', { name: 'Koszty rzeczywiste' }).click();
    await expect(
      card.getByRole('table', { name: 'Pozycje rozliczenia' })
    ).toBeVisible();
    await expect(adminPage).toHaveURL(/view=annual/);
    await adminPage.reload();
    await expect(
      card.getByRole('table', { name: 'Pozycje rozliczenia' })
    ).toBeVisible();
    const download = adminPage.waitForEvent('download');
    await card
      .getByRole('button', { name: 'Pobierz PDF', exact: true })
      .click();
    expect((await download).suggestedFilename()).toMatch(
      /^koszty-rzeczywiste-.*\.pdf$/
    );
  });

  test('is not shown to the tenant of the apartment', async ({ page }) => {
    await login(page, tenant.email, E2E_PASSWORD);

    await page.goto(pageOf(tenant.ownId));

    await expect(page).toHaveURL('/dashboard');
  });
});
