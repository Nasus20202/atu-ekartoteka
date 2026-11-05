import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

import { getVisualDatabaseUrl } from './e2e/utils/database-urls';

// Load environment variables from .env file
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

// Timeout constants
const WEB_SERVER_TIMEOUT_MS = 120 * 1000;
const TEST_TIMEOUT_MS = 60 * 1000;
const EXPECT_TIMEOUT_MS = 10 * 1000;

const FUNCTIONAL_PORT = 3000;
const VISUAL_PORT = 3001;
const INTEGRATIONS_PORT = 3002;
const MOCK_HTTP_PORT = 4010;
const MOCK_SMTP_PORT = 1025;
const FUNCTIONAL_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${FUNCTIONAL_PORT}`;
const VISUAL_BASE_URL =
  process.env.PLAYWRIGHT_VISUAL_BASE_URL || `http://localhost:${VISUAL_PORT}`;

const INTEGRATIONS_BASE_URL =
  process.env.PLAYWRIGHT_INTEGRATIONS_BASE_URL ||
  `http://localhost:${INTEGRATIONS_PORT}`;
// The mocks are reached from the app server by this host (a service name in Docker)
const MOCK_HOST = process.env.MOCK_HOST || 'localhost';
const MOCK_URL = `http://${MOCK_HOST}:${MOCK_HTTP_PORT}`;
const INTEGRATIONS_TEST_MATCH = '**/integrations/*.spec.ts';
const VISUAL_TEST_MATCH = '**/visual/*.spec.ts';
const VISUAL_MOBILE_ONLY_MATCH = '**/*.mobile.spec.ts';
const visualUse = {
  baseURL: VISUAL_BASE_URL,
  colorScheme: 'light' as const,
  locale: 'pl-PL',
  // Recharts skips its JS animations for reduced motion, so charts render fully drawn
  reducedMotion: 'reduce' as const,
  // Subpixel (LCD) text antialiasing depends on the host font config, so
  // grayscale antialiasing keeps snapshots identical across machines
  launchOptions: { args: ['--disable-lcd-text'] },
};
const visualProject = {
  testMatch: VISUAL_TEST_MATCH,
  snapshotPathTemplate:
    '{testDir}/visual/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',
};

const functionalDatabaseUrl = process.env.DATABASE_URL ?? '';
const visualDatabaseUrl = functionalDatabaseUrl
  ? getVisualDatabaseUrl(functionalDatabaseUrl)
  : '';

// Serves the production build on the port with the given database. Both servers
// run the same build, the way the Docker image runs once per database.
function appServer(
  port: number,
  databaseUrl: string,
  integrationEnv: Record<string, string> = {}
) {
  return {
    command: `node_modules/.bin/next start --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: WEB_SERVER_TIMEOUT_MS,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
      DATABASE_REPLICA_URLS: databaseUrl,
      AUTH_URL: `http://localhost:${port}`,
      AUTH_TRUST_HOST: 'true',
      // Disable Turnstile and SMTP for E2E tests
      TURNSTILE_SITE_KEY: '',
      TURNSTILE_SECRET_KEY: '',
      SMTP_HOST: '',
      E2E_ALLOW_FIXED_NOW: 'true',
      ...integrationEnv,
    },
  };
}

// Turnstile, SMTP and Google sign-in are on here, pointed at the local mocks
const integrationEnv = {
  APP_URL: INTEGRATIONS_BASE_URL,
  EMAIL_FROM: 'noreply@ekartoteka.test',
  SMTP_HOST: MOCK_HOST,
  SMTP_PORT: String(MOCK_SMTP_PORT),
  SMTP_SECURE: 'false',
  TURNSTILE_SITE_KEY: 'mock-site-key',
  TURNSTILE_SECRET_KEY: 'mock-secret-key',
  TURNSTILE_VERIFY_URL: `${MOCK_URL}/turnstile/siteverify`,
  GOOGLE_CLIENT_ID: 'mock-google-client-id',
  GOOGLE_CLIENT_SECRET: 'mock-google-client-secret',
  GOOGLE_ISSUER_URL: `${MOCK_URL}/google`,
};

const mockServer = {
  command: 'node_modules/.bin/tsx e2e/mocks/main.ts',
  url: `http://localhost:${MOCK_HTTP_PORT}/health`,
  reuseExistingServer: !process.env.CI,
  timeout: WEB_SERVER_TIMEOUT_MS,
};

/**
 * Playwright configuration for E2E tests.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Global setup and teardown */
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Use multiple workers for parallel execution */
  workers: process.env.CI ? 2 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? [['github'], ['list'], ['html']] : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: FUNCTIONAL_BASE_URL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
    /* Dates come from UTC midnight timestamps; a fixed zone keeps assertions host independent */
    timezoneId: 'Europe/Warsaw',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/admin/**', VISUAL_TEST_MATCH, INTEGRATIONS_TEST_MATCH],
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: [
        '**/admin/**',
        '**/cron/**',
        VISUAL_TEST_MATCH,
        INTEGRATIONS_TEST_MATCH,
      ],
    },
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/admin/**',
      fullyParallel: false,
    },
    {
      name: 'chromium-integrations',
      use: { ...devices['Desktop Chrome'], baseURL: INTEGRATIONS_BASE_URL },
      testMatch: INTEGRATIONS_TEST_MATCH,
      fullyParallel: false,
    },
    {
      ...visualProject,
      name: 'visual-desktop',
      testIgnore: VISUAL_MOBILE_ONLY_MATCH,
      use: { ...devices['Desktop Chrome'], ...visualUse },
    },
    {
      ...visualProject,
      name: 'visual-mobile',
      use: { ...devices['Pixel 7'], ...visualUse },
    },
  ],

  /* Start the production build three times (functional, visual, integrations) plus the mocks, unless an already running app (e.g. the Docker image) is targeted.
     The `test:e2e` scripts run `next build` first. */
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : [
        appServer(FUNCTIONAL_PORT, functionalDatabaseUrl),
        appServer(VISUAL_PORT, visualDatabaseUrl),
        mockServer,
        appServer(INTEGRATIONS_PORT, functionalDatabaseUrl, integrationEnv),
      ],

  /* Global timeout for each test */
  timeout: TEST_TIMEOUT_MS,

  /* Expect timeout */
  expect: {
    timeout: EXPECT_TIMEOUT_MS,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
      caret: 'hide',
      scale: 'css',
      stylePath: './e2e/visual/screenshot.css',
    },
  },
});
