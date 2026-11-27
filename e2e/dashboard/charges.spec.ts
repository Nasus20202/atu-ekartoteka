/**
 * Charges page tests - viewing charges per apartment
 */

import { expect, test } from '../fixtures';
import { CURRENT_MONTH_PARAM, CURRENT_MONTH_YEAR } from '../utils/date-utils';
import { openChargesMonth } from '../utils/navigation';

test.describe('Charges', () => {
  test('lists the current month and shows its lines once opened', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/charges');

    await expect(
      userPage.getByRole('heading', { name: /Naliczenia/i })
    ).toBeVisible();
    await expect(
      userPage.getByText(new RegExp(CURRENT_MONTH_YEAR, 'i')).first()
    ).toBeVisible();
    // 73 + 245 + 126.25
    await expect(userPage.getByText('444,25 zł').first()).toBeVisible();

    await openChargesMonth(userPage, CURRENT_MONTH_YEAR);

    await expect(userPage.getByText('ul. Testowa 1/1A').first()).toBeVisible();
    await expect(
      userPage.getByText(/Zarządzanie Nieruchomością/i)
    ).toBeVisible();
    await expect(userPage.getByText(/eksploatacja/i)).toBeVisible();
    await expect(userPage.getByText(/Fundusz remontowy/i)).toBeVisible();
    for (const amount of ['73,00 zł', '245,00 zł', '126,25 zł']) {
      await expect(userPage.getByText(amount).first()).toBeVisible();
    }
    // The quantity of the renovation fund
    await expect(userPage.getByText(/50[,.]5/).first()).toBeVisible();
  });

  test('month query opens that month on the charges page', async ({
    userPage,
  }) => {
    await userPage.goto(`/dashboard/charges?month=${CURRENT_MONTH_PARAM}`);

    await expect(
      userPage.getByRole('button', {
        name: new RegExp(`^${CURRENT_MONTH_YEAR}`, 'i'),
      })
    ).toHaveAttribute('aria-expanded', 'true');
    await expect(userPage.getByText(/Fundusz remontowy/i)).toBeVisible();
  });

  test('month query opens that month on the apartment charges page', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard');
    const chargesHref = await userPage
      .getByRole('link', { name: 'Naliczenia', exact: true })
      .getAttribute('href');

    await userPage.goto(`${chargesHref}?month=${CURRENT_MONTH_PARAM}`);

    await expect(userPage.getByText(/Fundusz remontowy/i)).toBeVisible();
    await expect(
      userPage.getByRole('button', { name: /Pobierz PDF/i }).first()
    ).toBeVisible();
  });
});
