/**
 * Custom Playwright fixtures for E2E tests.
 * Provides authenticated page contexts for admin and user roles.
 */

import { Page, test as base } from '@playwright/test';

import { FIXED_NOW_HEADER } from '../src/lib/utils/fixed-now';
import { TURNSTILE_VALID_TOKEN } from './mocks/constants';
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  MUST_CHANGE_PASSWORD_EMAIL,
  MUST_CHANGE_PASSWORD_PASSWORD,
  PROFILE_EMAIL,
  PROFILE_PASSWORD,
  USER_EMAIL,
  USER_PASSWORD,
  VISUAL_EMAIL,
  VISUAL_FIXED_NOW,
  VISUAL_MULTI_EMAIL,
  VISUAL_PASSWORD,
} from './utils/test-credentials';
import { stubTurnstileWidget } from './utils/turnstile-stub';

// React streams a section into a hidden segment first and swaps it in a moment
// later, so right after a navigation the same text can exist twice in the DOM.
const STREAMING_SEGMENT_SELECTOR = '[id^="S:"][hidden]';
const STREAMING_SETTLE_TIMEOUT = 10000;
const REACT_ROOT_KEY_PREFIX = '__reactContainer';

// A server redirect replaces the navigation that goto() started. Chromium
// resolves goto() with the redirected page, but Firefox rejects it, with
// NS_ERROR_FAILURE when the redirect also changes the session cookie.
const REDIRECT_INTERRUPTION_MESSAGES = [
  'interrupted by another navigation',
  'NS_BINDING_ABORTED',
  'NS_ERROR_FAILURE',
];

const wrappedPages = new WeakSet<Page>();

function isRedirectInterruption(error: unknown) {
  return (
    error instanceof Error &&
    REDIRECT_INTERRUPTION_MESSAGES.some((message) =>
      error.message.includes(message)
    )
  );
}

function waitForStreamedContentAfterGoto(page: Page) {
  if (wrappedPages.has(page)) {
    return;
  }

  wrappedPages.add(page);

  const goto = page.goto.bind(page);

  page.goto = async (...args: Parameters<Page['goto']>) => {
    const response = await goto(...args).catch(async (error: unknown) => {
      if (!isRedirectInterruption(error)) {
        throw error;
      }
      // Wait for the page the redirect led to; that is what the test expects
      await page.waitForLoadState('load');
      return null;
    });
    await page
      .waitForFunction(
        (selector) => !document.querySelector(selector),
        STREAMING_SEGMENT_SELECTOR,
        { timeout: STREAMING_SETTLE_TIMEOUT }
      )
      .catch(() => undefined);
    // Controls only react once the document has hydrated
    await page
      .waitForFunction(
        (prefix) => Object.keys(document).some((key) => key.startsWith(prefix)),
        REACT_ROOT_KEY_PREFIX,
        { timeout: STREAMING_SETTLE_TIMEOUT }
      )
      .catch(() => undefined);

    return response;
  };
}

/**
 * Login helper function
 */
export async function login(
  page: Page,
  email: string,
  password: string,
  origin = ''
) {
  waitForStreamedContentAfterGoto(page);
  await page.goto(`${origin}/login`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Hasło', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Zaloguj się', exact: true }).click();
  // Wait for redirect away from login
  await page.waitForURL((url) => !url.pathname.includes('/login'), {
    timeout: 10000,
  });
  // The forced password change page has no h1 and no refresh to wait for
  if (!new URL(page.url()).pathname.startsWith('/change-password')) {
    await waitForSignedInPage(page);
  }
}

/**
 * Waits for a signed-in landing page (every dashboard and admin page has an h1).
 * The login page calls router.refresh() after pushing here; a test that navigates
 * before that finishes can be redirected back, so the fixtures wait for it first.
 */
async function waitForSignedInPage(page: Page) {
  await page.getByRole('heading', { level: 1 }).first().waitFor();
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
  profilePage: Page;
  mustChangePasswordPage: Page;
  visualPage: Page;
  visualMultiPage: Page;
  visualAdminPage: Page;
}>({
  page: async ({ page }, use) => {
    waitForStreamedContentAfterGoto(page);
    await use(page);
  },

  /**
   * Page already logged in as admin
   */
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await waitForSignedInPage(page);
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
    await waitForSignedInPage(page);
    await use(page);
    await context.close();
  },

  /**
   * Page already logged in as the account reserved for mutating profile specs
   */
  profilePage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page, PROFILE_EMAIL, PROFILE_PASSWORD);
    await waitForSignedInPage(page);
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
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
    await login(page, VISUAL_EMAIL, VISUAL_PASSWORD);
    await use(page);
  },

  /**
   * Like visualPage, for the tenant with apartments in two HOAs
   */
  visualMultiPage: async ({ page }, use) => {
    await freezeVisualDate(page);
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
    await login(page, VISUAL_MULTI_EMAIL, VISUAL_PASSWORD);
    await use(page);
  },

  /**
   * Project page logged in as admin, with the date frozen at VISUAL_FIXED_NOW
   */
  visualAdminPage: async ({ page }, use) => {
    await freezeVisualDate(page);
    await stubTurnstileWidget(page, TURNSTILE_VALID_TOKEN);
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await use(page);
  },
});

export { expect } from '@playwright/test';
