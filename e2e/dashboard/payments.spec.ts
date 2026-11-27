/**
 * Payments page tests - viewing payments per apartment per year
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { POLISH_MONTHS } from '../utils/date-utils';

const CURRENT_YEAR = new Date().getFullYear();

const currentYearRow = (page: Page) =>
  page
    .getByRole('link', { name: new RegExp(`Rok ${CURRENT_YEAR}`) })
    .filter({ visible: true })
    .first();

test.describe('Payments', () => {
  test('lists the current year of the apartment with its balance', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/payments');

    await expect(
      userPage.getByRole('heading', { name: /Wpłaty/i })
    ).toBeVisible();
    await expect(
      userPage.getByText('ul. Testowa 1/1A').filter({ visible: true }).first()
    ).toBeVisible();
    await expect(currentYearRow(userPage)).toContainText('-444,25 zł');
    await expect(currentYearRow(userPage)).toContainText('Saldo końcowe');
  });

  test('opens a year with its months, amounts and balances', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/payments');
    await currentYearRow(userPage).click();

    await expect(userPage).toHaveURL(
      /\/dashboard\/payments\/[a-f0-9-]+\/\d{4}/
    );
    await expect(userPage.getByTestId('payment-monthly-chart')).toBeVisible();
    await expect(
      userPage.getByText(POLISH_MONTHS[new Date().getMonth()]).first()
    ).toBeVisible();
    await expect(
      userPage.getByText(/naliczenia|należności/i).first()
    ).toBeVisible();
    await expect(userPage.getByText(/wpłaty/i).first()).toBeVisible();
    await expect(
      userPage.getByText(/saldo|bilans|początkowe|końcowe/i).first()
    ).toBeVisible();
    await expect(
      userPage.getByText('444,25 zł').filter({ visible: true }).first()
    ).toBeVisible();
  });
});
