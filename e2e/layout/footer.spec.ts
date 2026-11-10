/**
 * The footer (version left, policy link right) ends every page in the page
 * flow: at the bottom edge of a short page, with no scroll, and at 390 px
 * without horizontal scroll.
 */

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { expectNoHorizontalOverflow } from '../utils/expect-no-horizontal-overflow';

const POLICY_LINK = 'Polityka prywatności';
const VERSION_PATTERN = /^v\d+\.\d+\.\d+/;

async function expectFooter(page: Page) {
  const footer = page.getByRole('contentinfo');

  await expect(footer).toBeVisible();
  await expect(footer.getByText(VERSION_PATTERN)).toBeVisible();
  const link = footer.getByRole('link', { name: POLICY_LINK });
  await expect(link).toHaveAttribute('href', '/privacy');

  const [versionBox, linkBox] = await Promise.all([
    footer.getByText(VERSION_PATTERN).boundingBox(),
    link.boundingBox(),
  ]);
  expect(versionBox!.x).toBeLessThan(linkBox!.x);
  expect(linkBox!.height).toBeGreaterThanOrEqual(44);
}

async function expectFooterAtBottomWithoutScroll(page: Page) {
  const footerBottom = await page
    .getByRole('contentinfo')
    .evaluate((element) => element.getBoundingClientRect().bottom);
  const { scrollHeight, innerHeight } = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    innerHeight: window.innerHeight,
  }));

  expect(scrollHeight).toBeLessThanOrEqual(innerHeight);
  expect(Math.round(footerBottom)).toBe(innerHeight);
}

test.describe('Footer on the auth pages', () => {
  for (const path of [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password?token=x',
  ]) {
    test(`${path} shows the version and the policy link`, async ({ page }) => {
      await page.goto(path);

      await expect(page.getByRole('contentinfo')).toBeVisible();
      await expectFooter(page);
      await expectNoHorizontalOverflow(page);
    });
  }

  test('sits at the bottom edge of a short page without page scroll', async ({
    page,
  }) => {
    await page.goto('/login');

    await expect(page.getByRole('contentinfo')).toBeVisible();
    await expectFooterAtBottomWithoutScroll(page);
  });

  test('the link opens the policy page', async ({ page }) => {
    await page.goto('/login');

    await page
      .getByRole('contentinfo')
      .getByRole('link', { name: POLICY_LINK })
      .click();

    await expect(page).toHaveURL(/\/privacy$/);
    await expect(page).toHaveTitle(/Polityka prywatności/);
  });
});

test.describe('Footer in the panels', () => {
  test('tenant dashboard ends with the footer', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    await expect(userPage.getByRole('contentinfo')).toBeVisible();
    await expectFooter(userPage);
    await expectNoHorizontalOverflow(userPage);
  });

  test('tenant profile ends with the footer, after the content', async ({
    userPage,
  }) => {
    await userPage.goto('/dashboard/profile');

    await expectFooter(userPage);
    const [mainBox, footerBox] = await Promise.all([
      userPage.getByRole('main').boundingBox(),
      userPage.getByRole('contentinfo').boundingBox(),
    ]);
    expect(footerBox!.y).toBeGreaterThanOrEqual(
      mainBox!.y + mainBox!.height - 1
    );
  });

  test('admin pages end with the footer', async ({ adminPage }) => {
    await adminPage.goto('/admin/settings');

    await expect(adminPage.getByRole('contentinfo')).toBeVisible();
    await expectFooter(adminPage);
    await expectNoHorizontalOverflow(adminPage);
  });

  test('no version label is fixed to a screen corner', async ({ userPage }) => {
    await userPage.goto('/dashboard');

    const fixedVersions = await userPage.evaluate(
      () =>
        [...document.querySelectorAll('p, span')].filter(
          (element) =>
            /^v\d+\.\d+\.\d+/.test(element.textContent ?? '') &&
            getComputedStyle(element.closest('div') ?? element).position ===
              'fixed'
        ).length
    );

    expect(fixedVersions).toBe(0);
  });
});
