import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables from .env file
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

// Timeout constants
const WEB_SERVER_TIMEOUT_MS = 120 * 1000;
const TEST_TIMEOUT_MS = 60 * 1000;
const EXPECT_TIMEOUT_MS = 10 * 1000;

const VISUAL_TEST_MATCH = '**/visual/*.spec.ts';
const VISUAL_MOBILE_ONLY_MATCH = '**/*.mobile.spec.ts';
const visualUse = {
  colorScheme: 'light' as const,
  locale: 'pl-PL',
  timezoneId: 'Europe/Warsaw',
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
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/admin/**', VISUAL_TEST_MATCH],
    },
    {
      name: 'chromium-mobile',
      use: { ...devices['Pixel 7'] },
      testIgnore: ['**/admin/**', VISUAL_TEST_MATCH],
    },
    {
      name: 'chromium-admin',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/admin/**',
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

  /* Run your local dev server before starting the tests, unless an already running app (e.g. the Docker image) is targeted */
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: 'node_modules/.bin/next dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: WEB_SERVER_TIMEOUT_MS,
        env: {
          ...process.env,
          // Disable Turnstile and SMTP for E2E tests
          TURNSTILE_SITE_KEY: '',
          TURNSTILE_SECRET_KEY: '',
          SMTP_HOST: '',
          E2E_ALLOW_FIXED_NOW: 'true',
        },
      },

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
