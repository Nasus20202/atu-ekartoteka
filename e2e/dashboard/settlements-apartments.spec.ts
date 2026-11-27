/** A tenant with two apartments moving between their settlements. */

import { expect, login, test } from '../fixtures';
import {
  assignSecondApartment,
  createSettlementTenant,
  deleteSettlementTenant,
  type SettlementTenant,
} from '../utils/settlement-tenant';
import { E2E_PASSWORD } from '../utils/test-credentials';

const PAGE = '/dashboard/settlements';

test.describe('Tenant settlements of two apartments', () => {
  let tenant: SettlementTenant;

  test.beforeAll(async () => {
    tenant = await createSettlementTenant();
    await assignSecondApartment(tenant);
  });

  test.afterAll(async () => {
    await deleteSettlementTenant(tenant);
  });

  test('switches the apartment and keeps the view', async ({ page }) => {
    await login(page, tenant.email, E2E_PASSWORD);
    await page.goto(
      `${PAGE}/${tenant.ownId}?period=${tenant.ownUtilityIds[1]}`
    );
    const select = page.getByRole('button', { name: 'Lokal' });
    const meters = page.getByRole('tab', { name: 'Liczniki' });
    await meters.click();

    for (const [number, id] of [
      ['2', tenant.foreignId],
      ['1', tenant.ownId],
    ]) {
      await select.click();
      await page
        .getByRole('menuitemradio', { name: new RegExp(`/${number}$`) })
        .click();

      // The chosen period belongs to the apartment that was left
      await expect(page).toHaveURL(new RegExp(`${PAGE}/${id}\\?view=meters$`));
      await expect(select).toContainText(`/${number}`);
      await expect(page.getByText(`Lokator ${number}`)).toBeVisible();
      await expect(meters).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('opens the first apartment from the section address', async ({
    page,
  }) => {
    await login(page, tenant.email, E2E_PASSWORD);

    await page.goto(PAGE);

    await expect(page).toHaveURL(
      new RegExp(`${PAGE}/(${tenant.ownId}|${tenant.foreignId})$`)
    );
  });
});
