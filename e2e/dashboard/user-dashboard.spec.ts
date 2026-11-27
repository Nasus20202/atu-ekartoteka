/**
 * Dashboard home page tests
 */

import { expect, test } from '../fixtures';
import { CURRENT_MONTH_YEAR } from '../utils/date-utils';
import { expandNotifications } from '../utils/expand-notifications';
import { openNavigationMenu } from '../utils/navigation';
import { USER_NAME } from '../utils/test-credentials';

const APARTMENT = 'ul. Testowa 1/1A';
// The seeded balance and the charges of the current month
const BALANCE = '-444,25 zł';
const CHARGES_TOTAL = '444,25 zł';
const MONTH_LINK = { name: new RegExp(CURRENT_MONTH_YEAR, 'i') };

test.describe('Dashboard Home', () => {
  test('greets the user and shows the apartment with its balance', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard');
    const visible = (text: string | RegExp) =>
      userPage.getByText(text).filter({ visible: true }).first();

    await expect(visible(new RegExp(`Witaj.*${USER_NAME}`, 'i'))).toBeVisible();
    await expect(visible(APARTMENT)).toBeVisible();
    await expect(userPage.getByText(/Saldo wpłat/i).first()).toBeVisible();
    // In single-HOA mode the HOA name labels the balance
    await expect(visible('Test HOA')).toBeVisible();
    const balance = userPage.getByText(BALANCE).first();
    await expect(balance).toBeVisible();
    await expect(balance).toHaveClass(/text-red/);
    await expect(userPage.getByTestId('balance-history-chart')).toBeVisible();
  });

  test('summarises the current charges and the payments', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard');

    await expect(userPage.getByRole('link', MONTH_LINK)).toContainText(
      CHARGES_TOTAL
    );
    await expect(
      userPage
        .getByText(/Naliczenia z ostatnich 12 miesięcy/i)
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    await expect(
      userPage
        .getByText(/Zobacz wszystkie wpłaty/i)
        .filter({ visible: true })
        .first()
    ).toBeVisible();
  });

  test('lists the notifications with the amount due', async ({ userPage }) => {
    await userPage.goto('/dashboard');
    await expandNotifications(userPage);

    await expect(userPage.getByText(/Powiadomienia/i)).toBeVisible();
    await expect(userPage.getByText(/Bieżące naliczenia/i)).toBeVisible();
    await expect(
      userPage
        .getByText(/Łączna kwota do zapłaty/i)
        .filter({ visible: true })
        .first()
    ).toBeVisible();
    await expect(userPage.getByText(CHARGES_TOTAL).first()).toBeVisible();
    // A single HOA gets a flat list, with no section to open first
    await expect(
      userPage.getByText(/Zarządzanie Nieruchomością/i).first()
    ).toBeVisible();
  });

  test('links to the payments, the charges and the account', async ({
    userPage,
  }) => {
    const follow = async (link: () => Promise<void>, url: RegExp) => {
      await userPage.goto('/dashboard');
      await link();
      await expect(userPage).toHaveURL(url);
    };

    await follow(
      () =>
        userPage
          .getByRole('link', { name: /ul\. Testowa 1\/1A/ })
          .first()
          .click(),
      /\/dashboard\/payments\/[^/]+\/\d{4}/
    );
    await follow(
      () => userPage.getByText(/Zobacz wszystkie naliczenia/i).click(),
      /\/dashboard\/charges/
    );
    await follow(
      () => userPage.getByRole('link', MONTH_LINK).click(),
      /\/dashboard\/charges\?month=\d{4}-\d{2}/
    );
    await follow(
      () =>
        userPage
          .getByText(/Zobacz wszystkie wpłaty/i)
          .filter({ visible: true })
          .first()
          .click(),
      /\/dashboard\/payments/
    );
    await follow(async () => {
      await openNavigationMenu(userPage);
      await expect(
        userPage.getByRole('button', { name: /Wyloguj/i })
      ).toBeVisible();
      await userPage.getByRole('link', { name: /Profil/i }).click();
    }, /\/dashboard\/profile/);
  });
});
