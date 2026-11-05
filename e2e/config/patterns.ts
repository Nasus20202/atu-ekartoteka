/**
 * File-matching globs for the Playwright projects, and URL globs the tests wait
 * for. Kept together so a rename of a folder or route touches one file.
 */

export const ADMIN_TEST_MATCH = '**/admin/**';
export const CRON_TEST_MATCH = '**/cron/**';
export const VISUAL_TEST_MATCH = '**/visual/*.spec.ts';
export const VISUAL_MOBILE_ONLY_MATCH = '**/*.mobile.spec.ts';
export const INTEGRATIONS_TEST_MATCH = '**/integrations/*.spec.ts';

export const ROUTE_GLOB = {
  login: '**/login**',
  dashboard: '**/dashboard**',
  changePassword: '**/change-password**',
} as const;
