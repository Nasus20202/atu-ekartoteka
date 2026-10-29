/**
 * Custom Playwright fixtures for E2E tests.
 * Provides authenticated page contexts for admin and user roles.
 */

import { Page, test as base } from '@playwright/test';

import { FIXED_NOW_HEADER } from '../src/lib/utils/fixed-now';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  MUST_CHANGE_PASSWORD_EMAIL,
  MUST_CHANGE_PASSWORD_PASSWORD,
  USER_EMAIL,
  USER_PASSWORD,
  VISUAL_EMAIL,
  VISUAL_FIXED_NOW,
  VISUAL_MULTI_EMAIL,
  VISUAL_PASSWORD,
} from './utils/test-credentials';

/**
 * Login helper function
 */
async function login(page: Page, email: string, password: string, origin = '') {
  await page.goto(`${origin}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
}

async function freezeVisualDate(page: Page) {
  // The app honours the header only with E2E_ALLOW_FIXED_NOW=true
  await page.setExtraHTTPHeaders({ [FIXED_NOW_HEADER]: VISUAL_FIXED_NOW });
  await page.clock.setFixedTime(VISUAL_FIXED_NOW);
}

/**
 * Extended test fixtures
 */
export const test = base.extend<{
  adminPage: Page;
  userPage: Page;
  mustChangePasswordPage: Page;
  visualPage: Page;
  visualMultiPage: Page;
  visualAdminPage: Page;
}>({
  /**
   * Page already logged in as admin
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(page);
    await context.close();
  },

  /**
   * Page already logged in as regular user
   */
  userPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, USER_EMAIL, USER_PASSWORD);
    await use(page);
    await context.close();
  },

  /**
   * Page logged in as user with mustChangePassword=true,
   * landed on /change-password after login.
   */
  mustChangePasswordPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(
      page,
      MUST_CHANGE_PASSWORD_EMAIL,
      MUST_CHANGE_PASSWORD_PASSWORD
    );
    await use(page);
    await context.close();
  },

  /**
   * Project page (keeps device settings) logged in as the visual test user,
   * with the date frozen at VISUAL_FIXED_NOW
   */
  visualPage: async ({ page }, use) => {
    await freezeVisualDate(page);
    await login(page, VISUAL_EMAIL, VISUAL_PASSWORD);
    await use(page);
  },

  /**
   * Like visualPage, for the tenant with apartments in two HOAs
   */
  visualMultiPage: async ({ page }, use) => {
    await freezeVisualDate(page);
    await login(page, VISUAL_MULTI_EMAIL, VISUAL_PASSWORD);
    await use(page);
  },

  /**
   * Project page logged in as admin, with the date frozen at VISUAL_FIXED_NOW
   */
  visualAdminPage: async ({ page }, use) => {
    await freezeVisualDate(page);
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(page);
  },
});

export { expect } from '@playwright/test';
