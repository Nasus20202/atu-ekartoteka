/**
 * Shared test credentials - must match seed-test-data.ts
 */

export const ADMIN_EMAIL = 'admin@e2e-test.com';
export const ADMIN_PASSWORD = 'AdminPassword123!';
export const ADMIN_NAME = 'E2E Admin';

export const USER_EMAIL = 'user@e2e-test.com';
export const USER_PASSWORD = 'UserPassword123!';
export const USER_NAME = 'E2E Test User';

export const MUST_CHANGE_PASSWORD_EMAIL = 'must-change-password@e2e-test.com';
export const MUST_CHANGE_PASSWORD_PASSWORD = 'TempPassword123!';
export const MUST_CHANGE_PASSWORD_NEW_PASSWORD = 'NewPassword456!';
export const MUST_CHANGE_PASSWORD_NAME = 'E2E MustChange User';

// Password reset token for testing
export const RESET_TOKEN = 'e2e-test-reset-token-12345';

// Email verification credentials
export const UNVERIFIED_EMAIL = 'unverified@e2e-test.com';
export const UNVERIFIED_PASSWORD = 'TestPassword123!';
export const VERIFICATION_CODE = 'e2e-test-verification-token-12345';

// Visual regression users with data fixed in time, see VISUAL_FIXED_NOW
export const VISUAL_PASSWORD = 'VisualPassword123!';
export const VISUAL_YEAR = 2024;
export const VISUAL_FIXED_NOW = '2024-12-15T12:00:00Z';
export const VISUAL_HOA_EXTERNAL_ID = 'TESTVIS';
export const VISUAL_HOA_NAME =
  'Testowa Wspólnota Mieszkaniowa E2E z bardzo długą nazwą';
export const VISUAL_SECOND_HOA_EXTERNAL_ID = 'TESTVIS2';
export const VISUAL_SECOND_HOA_NAME = 'Druga Testowa Wspólnota E2E';
// One apartment in one HOA
export const VISUAL_EMAIL = 'visual@e2e-test.com';
export const VISUAL_NAME = 'E2E Visual User';
// One apartment in each of the two HOAs
export const VISUAL_MULTI_EMAIL = 'visual-multi@e2e-test.com';
export const VISUAL_MULTI_NAME = 'E2E Visual Multi User';
