/**
 * Admin on-demand validation of the data stored in the database.
 */

import type { Locator } from '@playwright/test';

import { expect, test } from '../fixtures';

test.describe('Database validation', () => {
  test('admin can validate stored data from the import page', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    // Either outcome proves the checks ran: a clean database or per-HOA findings
    await expect(
      adminPage
        .getByText(/nie znaleziono błędów ani ostrzeżeń/)
        .or(adminPage.getByRole('button', { name: /^Wspólnota:/ }).first())
    ).toBeVisible();
  });

  test('validation shows the result banner and the year balance grid', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    await expect(
      adminPage.getByText(
        /Walidacja (zakończona pomyślnie|z uwagami|nie powiodła się)/
      )
    ).toBeVisible();
    await expect(
      adminPage.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeVisible();
  });

  test('skipping the full validation shows the balance table only', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByLabel('Pomiń pełną walidację').check();
    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    await expect(
      adminPage.getByText(/Pełna walidacja pominięta/)
    ).toBeVisible();
    await expect(
      adminPage.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeVisible();
  });

  test('clicking a balance value shows the apartment records of that year', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();
    await adminPage.getByRole('table').getByRole('button').first().click();

    await expect(adminPage.getByRole('dialog')).toBeVisible();
    await adminPage.keyboard.press('Escape');
    await expect(adminPage.getByRole('dialog')).toBeHidden();
  });

  test('shows a spinner on the button while the validation runs', async ({
    adminPage,
  }) => {
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await adminPage.route('**/api/admin/import/validate', async (route) => {
      await gate;
      await route.continue();
    });
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    const running = adminPage.getByRole('button', { name: /Walidowanie/ });
    await expect(running).toBeDisabled();
    await expect(running.locator('svg[class*="animate-spin"]')).toBeVisible();

    release();
    await expect(
      adminPage.getByRole('heading', { name: 'Salda lat według wspólnot' })
    ).toBeVisible();
    await expect(
      adminPage.getByRole('button', { name: 'Waliduj dane' })
    ).toBeEnabled();
  });

  test('balance grid lists years oldest first, opening before closing', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');

    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();
    const grid = adminPage
      .getByRole('region', { name: 'Salda lat według wspólnot' })
      .getByRole('table');
    await expect(grid.locator('th[data-year-start]').first()).toBeVisible();

    // Firefox crashes on locator.evaluateAll over this grid, so read cell by cell
    const textsOf = async (cells: Locator) =>
      Promise.all(
        Array.from({ length: await cells.count() }, (_, index) =>
          cells.nth(index).textContent()
        )
      );
    const years = (await textsOf(grid.locator('th[data-year-start]'))).map(
      (text) => Number(text?.slice(0, 4))
    );
    expect(years.length).toBeGreaterThan(1);
    expect(years).toEqual([...years].sort((a, b) => a - b));
    const subHeaders = (
      await textsOf(grid.locator('thead tr:nth-child(2) th'))
    ).map((text) => text?.trim());
    expect(subHeaders).toEqual(years.flatMap(() => ['Otwarcie', 'Zamknięcie']));
  });

  test('year buttons scroll the balance grid, which opens on the newest year', async ({
    adminPage,
  }) => {
    await adminPage.goto('/admin/import');
    await adminPage.getByRole('button', { name: 'Waliduj dane' }).click();

    const region = adminPage.getByRole('region', {
      name: 'Salda lat według wspólnot',
    });
    const scroller = region.getByRole('table').locator('xpath=..');
    const previous = region.getByRole('button', { name: 'Poprzedni rok' });
    const next = region.getByRole('button', { name: 'Następny rok' });
    const scrollLeft = () => scroller.evaluate((el) => el.scrollLeft);
    // Smooth scrolling is done when the position stays put for a few frames
    const settled = () =>
      scroller.evaluate(
        (el) =>
          new Promise<void>((resolve) => {
            let last = -1;
            let still = 0;
            const tick = () => {
              still = el.scrollLeft === last ? still + 1 : 0;
              last = el.scrollLeft;
              if (still >= 5) resolve();
              else requestAnimationFrame(tick);
            };
            tick();
          })
      );

    await expect(next).toBeDisabled();
    await expect(previous).toBeEnabled();
    const newest = await scrollLeft();
    expect(newest).toBeGreaterThan(0);

    await previous.click();
    await settled();
    expect(await scrollLeft()).toBeLessThan(newest);
    await expect(next).toBeEnabled();

    await next.click();
    await settled();
    expect(await scrollLeft()).toBe(newest);
    await expect(next).toBeDisabled();
  });
});
