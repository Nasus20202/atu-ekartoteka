/**
 * Tenants see only the current year plus the configured number of previous
 * full years; admins configure it and keep seeing the full history.
 * Serial: the setting is global, so it must not change under other tests here.
 */

import type { Page } from '@playwright/test';

import { DEFAULT_TENANT_HISTORY_YEARS_BACK } from '../../src/lib/settings/constants';
import { expect, login, test } from '../fixtures';
import { createMixedPaymentsUser } from '../utils/create-mixed-payments-user';
import { deleteUserAndApartmentsByEmail } from '../utils/delete-user-and-apartments-by-email';
import { USER_PASSWORD } from '../utils/test-credentials';

const SETTINGS_URL = '/api/admin/settings';
const YEARS_INPUT_LABEL = 'Liczba poprzednich lat widocznych dla mieszkańców';
const VISIBLE_OFFSET = DEFAULT_TENANT_HISTORY_YEARS_BACK;
const HIDDEN_OFFSET = DEFAULT_TENANT_HISTORY_YEARS_BACK + 1;

test.describe.configure({ mode: 'serial' });

test.describe('Tenant history window', () => {
  let seed: Awaited<ReturnType<typeof createMixedPaymentsUser>>;
  let visibleYear: number;
  let hiddenYear: number;

  test.beforeAll(async () => {
    seed = await createMixedPaymentsUser({
      yearsAgo: [VISIBLE_OFFSET, HIDDEN_OFFSET],
    });
    visibleYear = seed.year - VISIBLE_OFFSET;
    hiddenYear = seed.year - HIDDEN_OFFSET;
  });

  test.afterAll(async () => {
    await deleteUserAndApartmentsByEmail(seed.email);
  });

  async function tenantPage(page: Page) {
    await login(page, seed.email, USER_PASSWORD);
    return page;
  }

  async function setYearsBack(adminPage: Page, value: number) {
    const response = await adminPage.request.put(SETTINGS_URL, {
      data: { tenantHistoryYearsBack: value },
    });
    expect(response.ok(), await response.text()).toBe(true);
  }

  test('tenant sees only years inside the default window', async ({
    page,
    adminPage,
  }) => {
    await setYearsBack(adminPage, DEFAULT_TENANT_HISTORY_YEARS_BACK);
    await tenantPage(page);

    await page.goto('/dashboard/payments');
    await expect(page.getByText(`Rok ${seed.year}`)).toBeVisible();
    await expect(page.getByText(`Rok ${visibleYear}`)).toBeVisible();
    await expect(page.getByText(`Rok ${hiddenYear}`)).toHaveCount(0);

    await page.goto(`/dashboard/payments/${seed.apartmentId}/${seed.year}`);
    await page.getByRole('button', { name: 'Rok', exact: true }).click();
    await expect(
      page.getByRole('menuitemradio', { name: `Rok ${visibleYear}` })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitemradio', { name: `Rok ${hiddenYear}` })
    ).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.goto(`/dashboard/payments/${seed.apartmentId}/${hiddenYear}`);
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();

    await page.goto(`/dashboard/charges/${seed.apartmentId}`);
    await expect(
      page.getByRole('button', { name: String(visibleYear) })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: String(hiddenYear) })
    ).toHaveCount(0);
  });

  test('admin still sees the full history', async ({ adminPage }) => {
    await adminPage.goto(`/admin/apartments/${seed.hoaId}/${seed.apartmentId}`);

    await expect(adminPage.getByText(`Rok ${hiddenYear}`)).toBeVisible();
  });

  test('admin widens the window on the settings page', async ({
    page,
    adminPage,
  }) => {
    try {
      await adminPage.goto('/admin/settings');
      const input = adminPage.getByLabel(YEARS_INPUT_LABEL);
      await expect(input).toHaveValue(
        String(DEFAULT_TENANT_HISTORY_YEARS_BACK)
      );

      await adminPage.getByRole('button', { name: 'Więcej lat' }).click();
      await expect(input).toHaveValue(String(HIDDEN_OFFSET));
      await expect(
        adminPage.getByText(`Mieszkańcy widzą lata ${hiddenYear}–${seed.year}`)
      ).toBeVisible();
      await adminPage.getByRole('button', { name: 'Zapisz' }).click();
      await expect(adminPage.getByText('Zapisano ustawienia')).toBeVisible();

      await tenantPage(page);
      await page.goto('/dashboard/payments');
      await expect(page.getByText(`Rok ${hiddenYear}`)).toBeVisible();
    } finally {
      await setYearsBack(adminPage, DEFAULT_TENANT_HISTORY_YEARS_BACK);
    }
  });

  test('settings are listed in the admin navigation', async ({ adminPage }) => {
    await adminPage.goto('/admin');
    await adminPage.getByRole('link', { name: 'Ustawienia' }).first().click();
    await expect(adminPage).toHaveURL(/\/admin\/settings$/);
  });
});
