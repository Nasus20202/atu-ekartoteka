import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import {
  FUNCTIONAL_BASE_URL,
  FUNCTIONAL_PORT,
  INTEGRATIONS_BASE_URL,
  INTEGRATIONS_PORT,
  LOCAL_HOST,
  MOCK_ENDPOINT_PATHS,
  MOCK_HEALTH_URL,
  MOCK_HOST,
  MOCK_SERVER_URL,
  MOCK_SMTP_PORT,
  VISUAL_BASE_URL,
  VISUAL_PORT,
} from './e2e/config/endpoints';
import {
  ADMIN_TEST_MATCH,
  CRON_TEST_MATCH,
  INTEGRATIONS_TEST_MATCH,
  VISUAL_MOBILE_ONLY_MATCH,
  VISUAL_TEST_MATCH,
} from './e2e/config/patterns';
import { getVisualDatabaseUrl } from './e2e/utils/database-urls';

// Load environment variables from .env file
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

const SECOND_MS = 1000;
const WEB_SERVER_TIMEOUT_MS = 120 * SECOND_MS;
const TEST_TIMEOUT_MS = 60 * SECOND_MS;
const EXPECT_TIMEOUT_MS = 10 * SECOND_MS;
const CI_RETRIES = 2;
const CI_WORKERS = 2;
const MAX_SCREENSHOT_DIFF_RATIO = 0.01;

const TIMEZONE_ID = 'Europe/Warsaw';
const VISUAL_LOCALE = 'pl-PL';
const VISUAL_SNAPSHOT_PATH =
  '{testDir}/visual/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}';
const SCREENSHOT_STYLE_PATH = './e2e/visual/screenshot.css';
// The PDF tests render pages, which have no viewport layout: desktop only
const PDF_TEST_MATCH = '**/visual/pdf-documents.spec.ts';

const functionalDatabaseUrl = process.env.DATABASE_URL ?? '';
const visualDatabaseUrl = functionalDatabaseUrl
  ? getVisualDatabaseUrl(functionalDatabaseUrl)
  : '';

const visualUse = {
  baseURL: VISUAL_BASE_URL,
  colorScheme: 'light' as const,
  locale: VISUAL_LOCALE,
  // Recharts skips its JS animations for reduced motion, so charts render fully drawn
  reducedMotion: 'reduce' as const,
  // Subpixel (LCD) text antialiasing depends on the host font config, so
  // grayscale antialiasing keeps snapshots identical across machines
  launchOptions: { args: ['--disable-lcd-text'] },
};

// Serves the production build on the port with the given database. Both servers
// run the same build, the way the Docker image runs once per database.
function appServer(
  port: number,
  databaseUrl: string,
  extraEnv: Record<string, string> = {}
) {
  const appUrl = `http://${LOCAL_HOST}:${port}`;
  return {
    command: `node_modules/.bin/next start --port ${port}`,
    url: appUrl,
    reuseExistingServer: !process.env.CI,
    timeout: WEB_SERVER_TIMEOUT_MS,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_REPLICA_URLS: databaseUrl,
      AUTH_URL: appUrl,
      AUTH_TRUST_HOST: 'true',
      // Disable Turnstile and SMTP for E2E tests
      TURNSTILE_SITE_KEY: '',
      TURNSTILE_SECRET_KEY: '',
      SMTP_HOST: '',
      E2E_ALLOW_FIXED_NOW: 'true',
      ...extraEnv,
    },
  };
}

// Google sign-in is configured on the visual app so the login page snapshot
// shows the button; nothing there ever starts the OAuth flow
const visualEnv = {
  GOOGLE_CLIENT_ID: 'visual-google-client-id',
  GOOGLE_CLIENT_SECRET: 'visual-google-client-secret',
};

// Turnstile, SMTP and Google sign-in are on here, pointed at the local mocks
const integrationEnv = {
  APP_URL: INTEGRATIONS_BASE_URL,
  EMAIL_FROM: 'noreply@ekartoteka.test',
  SMTP_HOST: MOCK_HOST,
  SMTP_PORT: String(MOCK_SMTP_PORT),
  SMTP_SECURE: 'false',
  TURNSTILE_SITE_KEY: 'mock-site-key',
  TURNSTILE_SECRET_KEY: 'mock-secret-key',
  TURNSTILE_VERIFY_URL: `${MOCK_SERVER_URL}${MOCK_ENDPOINT_PATHS.turnstileVerify}`,
  GOOGLE_CLIENT_ID: 'mock-google-client-id',
  GOOGLE_CLIENT_SECRET: 'mock-google-client-secret',
  GOOGLE_ISSUER_URL: `${MOCK_SERVER_URL}${MOCK_ENDPOINT_PATHS.google}`,
};

const mockServer = {
  command: 'node_modules/.bin/tsx e2e/mocks/main.ts',
  url: MOCK_HEALTH_URL,
  reuseExistingServer: !process.env.CI,
  timeout: WEB_SERVER_TIMEOUT_MS,
};

const functionalIgnore = [
  ADMIN_TEST_MATCH,
  VISUAL_TEST_MATCH,
  INTEGRATIONS_TEST_MATCH,
];

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? CI_RETRIES : 0,
  workers: process.env.CI ? CI_WORKERS : undefined,
  reporter: process.env.CI ? [['github'], ['list'], ['html']] : [['html']],
  use: {
    baseURL: FUNCTIONAL_BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Dates come from UTC midnight timestamps; a fixed zone keeps assertions host independent
    timezoneId: TIMEZONE_ID,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: functionalIgnore,
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: [...functionalIgnore, CRON_TEST_MATCH],
    },
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: ADMIN_TEST_MATCH,
      fullyParallel: false,
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testIgnore: functionalIgnore,
    },
    {
      name: 'firefox-admin',
      use: { ...devices['Desktop Firefox'] },
      testMatch: ADMIN_TEST_MATCH,
      fullyParallel: false,
    },
    {
      name: 'chromium-integrations',
      use: { ...devices['Desktop Chrome'], baseURL: INTEGRATIONS_BASE_URL },
      testMatch: INTEGRATIONS_TEST_MATCH,
      fullyParallel: false,
    },
    {
      name: 'visual-desktop',
      testMatch: VISUAL_TEST_MATCH,
      testIgnore: VISUAL_MOBILE_ONLY_MATCH,
      snapshotPathTemplate: VISUAL_SNAPSHOT_PATH,
      use: { ...devices['Desktop Chrome'], ...visualUse },
    },
    {
      name: 'visual-mobile',
      testMatch: VISUAL_TEST_MATCH,
      testIgnore: [PDF_TEST_MATCH],
      snapshotPathTemplate: VISUAL_SNAPSHOT_PATH,
      use: { ...devices['Pixel 7'], ...visualUse },
    },
  ],

  // The production build runs three times (functional, visual, integrations) and the
  // mocks run once. Set PLAYWRIGHT_SKIP_WEBSERVER to target an app that is already up.
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        appServer(FUNCTIONAL_PORT, functionalDatabaseUrl),
        appServer(VISUAL_PORT, visualDatabaseUrl, visualEnv),
        mockServer,
        appServer(INTEGRATIONS_PORT, functionalDatabaseUrl, integrationEnv),
      ],

  timeout: TEST_TIMEOUT_MS,

  expect: {
    timeout: EXPECT_TIMEOUT_MS,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: MAX_SCREENSHOT_DIFF_RATIO,
      caret: 'hide',
      scale: 'css',
      stylePath: SCREENSHOT_STYLE_PATH,
    },
  },
});
