/**
 * Where the e2e servers listen and how the tests reach them. The Playwright
 * config and the test helpers both import from here, so a port or host is
 * changed in one place.
 */

import {
  MOCK_HTTP_PORT,
  MOCK_PUBLIC_URL,
  MOCK_SMTP_PORT,
} from '../mocks/constants';

export const LOCAL_HOST = 'localhost';
export const LOCAL_ORIGIN = `http://${LOCAL_HOST}`;

export const FUNCTIONAL_PORT = 3000;
export const VISUAL_PORT = 3001;
export const INTEGRATIONS_PORT = 3002;

export const FUNCTIONAL_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL || `${LOCAL_ORIGIN}:${FUNCTIONAL_PORT}`;
export const VISUAL_BASE_URL =
  process.env.PLAYWRIGHT_VISUAL_BASE_URL || `${LOCAL_ORIGIN}:${VISUAL_PORT}`;
export const INTEGRATIONS_BASE_URL =
  process.env.PLAYWRIGHT_INTEGRATIONS_BASE_URL ||
  `${LOCAL_ORIGIN}:${INTEGRATIONS_PORT}`;

// The app and mocks are reached from the app server by this host (a service name in Docker)
export const MOCK_HOST = process.env.MOCK_HOST || LOCAL_HOST;
// Public address the tests call; the app reaches the same server at MOCK_SERVER_URL
export const MOCK_URL = process.env.MOCK_URL ?? MOCK_PUBLIC_URL;
export const MOCK_SERVER_URL = `http://${MOCK_HOST}:${MOCK_HTTP_PORT}`;
export const MOCK_SMTP_HOST = MOCK_HOST;

export const MOCK_HEALTH_URL = `${LOCAL_ORIGIN}:${MOCK_HTTP_PORT}/health`;
export const MOCK_ENDPOINT_PATHS = {
  turnstileVerify: '/turnstile/siteverify',
  google: '/google',
} as const;

export { MOCK_HTTP_PORT, MOCK_SMTP_PORT };
