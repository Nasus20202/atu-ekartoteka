/**
 * Visual regression tests for the public privacy policy page.
 * Serial, and the policy is cleared afterwards: it is a global setting that the
 * settings screenshots show as published or not.
 */

import { expect, test } from '../fixtures';
import { getVisualDatabaseUrl } from '../utils/database-urls';
import { setPrivacyPolicy as setPolicyIn } from '../utils/privacy-policy';

// The visual app runs on its own database
const setPrivacyPolicy = (text: string | null) =>
  setPolicyIn(text, getVisualDatabaseUrl(process.env.DATABASE_URL ?? ''));

const POLICY = `# Polityka prywatności

Administratorem Twoich danych jest **Wspólnota Mieszkaniowa Przykładowa**, adres e-mail: [kontakt@example.com](mailto:kontakt@example.com).

## Jakie dane przetwarzamy

- adres e-mail i imię, aby założyć konto,
- numery lokali, aby pokazać Ci Twoje rozliczenia,
- identyfikator konta w dziennikach działania serwisu.

## Twoje prawa

Możesz żądać dostępu do danych, ich sprostowania, usunięcia i ograniczenia przetwarzania. Skargę możesz złożyć do Prezesa Urzędu Ochrony Danych Osobowych.

Data wejścia w życie tej polityki: 1 stycznia 2026 r.`;

test.describe.configure({ mode: 'serial' });

test.describe('Visual: privacy policy page', () => {
  test.afterAll(async () => {
    await setPrivacyPolicy(null);
  });

  test('published policy', async ({ page }) => {
    await setPrivacyPolicy(POLICY);
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();

    await expect(page).toHaveScreenshot('privacy.png', { fullPage: true });
  });

  test('published policy in dark mode', async ({ page }) => {
    await setPrivacyPolicy(POLICY);
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();

    await expect(page).toHaveScreenshot('privacy-dark.png', {
      fullPage: true,
    });
  });

  test('printed policy is dark text on white even in dark mode', async ({
    page,
  }) => {
    await setPrivacyPolicy(POLICY);
    await page.emulateMedia({ colorScheme: 'dark', media: 'print' });
    await page.goto('/privacy');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Polityka prywatności' })
    ).toBeVisible();

    await expect(page).toHaveScreenshot('privacy-print.png', {
      fullPage: true,
    });
  });

  test('policy that is not published yet', async ({ page }) => {
    await setPrivacyPolicy(null);
    await page.goto('/privacy');
    await expect(
      page.getByText('Polityka prywatności nie została jeszcze opublikowana.')
    ).toBeVisible();

    await expect(page).toHaveScreenshot('privacy-empty.png', {
      fullPage: true,
    });
  });
});
