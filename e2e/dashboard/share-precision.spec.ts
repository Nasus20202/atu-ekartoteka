import { expect, test } from '../fixtures';

test.describe('Share Precision', () => {
  test('tenant dashboard shows share percentage with 4 decimal places', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard');

    // Seeded data: shareNumerator=50.5, shareDenominator=1000
    // sharePercent = (50.5 / 1000) * 100 = 5.05 → "5.05%"
    await expect(userPage.getByText('5.05%').first()).toBeVisible();
  });
});
