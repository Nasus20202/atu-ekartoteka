/**
 * Dashboard home page tests
 */

import { expect, test } from '../fixtures';
import { CURRENT_MONTH_YEAR } from '../utils/date-utils';
import { USER_NAME } from '../utils/test-credentials';

test.describe('Dashboard Home', () => {
  test.describe('Welcome Section', () => {
    test('user sees welcome message with their name', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      await expect(
        userPage.getByText(new RegExp(`Witaj.*${USER_NAME}`, 'i'))
      ).toBeVisible();
    });

    test('user sees their assigned apartment', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see apartment address from seeded data
      await expect(
        userPage.getByText('ul. Testowa 1/1A').first()
      ).toBeVisible();
    });
  });

  test.describe('Balance Widget', () => {
    test('user sees balance widget', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see "Saldo wpłat" section
      await expect(userPage.getByText(/Saldo wpłat/i).first()).toBeVisible();
    });

    test('user sees current balance amount', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see balance information (seeded as -444.25)
      await expect(userPage.getByText('-444.25 zł').first()).toBeVisible();
    });

    test('negative balance is highlighted in red', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Balance should have red color class for negative amount
      const balanceElement = userPage.getByText('-444.25 zł').first();
      await expect(balanceElement).toBeVisible();
      await expect(balanceElement).toHaveClass(/text-red/);
    });
  });

  test.describe('Charges Widget', () => {
    test('user sees charges section', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see "Naliczenia" section
      await expect(userPage.getByText(/Naliczenia/i).first()).toBeVisible();
    });

    test('user sees current month charges', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see current period charges
      await expect(
        userPage.getByText(new RegExp(CURRENT_MONTH_YEAR, 'i'))
      ).toBeVisible();
    });

    test('user sees total charges amount', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see total charges (444.25 zł)
      await expect(userPage.getByText('444,25 zł').first()).toBeVisible();
    });

    test('user can click to view all charges', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      await userPage.getByText(/Zobacz wszystkie naliczenia/i).click();

      await expect(userPage).toHaveURL(/\/dashboard\/charges/);
    });
  });

  test.describe('Payments Widget', () => {
    test('user sees payments section', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see payments/balance section
      await expect(
        userPage.getByText(/Zobacz wszystkie wpłaty/i)
      ).toBeVisible();
    });

    test('user can click to view all payments', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      await userPage.getByText(/Zobacz wszystkie wpłaty/i).click();

      await expect(userPage).toHaveURL(/\/dashboard\/payments/);
    });
  });

  test.describe('Notifications Widget', () => {
    test('user sees notifications panel', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see "Powiadomienia" section
      await expect(userPage.getByText(/Powiadomienia/i)).toBeVisible();
    });

    test('notifications show current charges breakdown', async ({
      userPage,
    }) => {
      await userPage.goto('/dashboard');

      // Should see charge notification items
      await expect(userPage.getByText(/Bieżące naliczenia/i)).toBeVisible();
    });

    test('notifications show total amount due', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see "Łączna kwota do zapłaty"
      await expect(
        userPage.getByText(/Łączna kwota do zapłaty/i)
      ).toBeVisible();
      await expect(userPage.getByText('444.25 zł').first()).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('user can navigate to profile from header', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      await userPage.getByRole('link', { name: /Profil/i }).click();

      await expect(userPage).toHaveURL(/\/dashboard\/profile/);
    });

    test('header shows logout option', async ({ userPage }) => {
      await userPage.goto('/dashboard');

      // Should see logout text/button in header
      await expect(userPage.getByText(/Wyloguj/i).first()).toBeVisible();
    });
  });
});
