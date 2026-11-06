/**
 * Shared test credentials - must match seed-test-data.ts
 */

export const ADMIN_EMAIL = 'admin@e2e-test.com';
export const ADMIN_PASSWORD = 'AdminPassword123!';
export const ADMIN_NAME = 'E2E Admin';

export const USER_EMAIL = 'user@e2e-test.com';
export const USER_PASSWORD = 'UserPassword123!';
export const USER_NAME = 'E2E Test User';

// Dedicated to tests that mutate their own account (name, password), so they
// never race the shared user asserted by the login and dashboard specs.
export const PROFILE_EMAIL = 'profile@e2e-test.com';
export const PROFILE_PASSWORD = 'ProfilePassword123!';
export const PROFILE_NAME = 'E2E Profile User';

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
// Waiting for approval, with an email that has no spaces to exercise the users list layout
export const VISUAL_PENDING_EMAIL =
  'visual.pending.user.with.a.very.long.unbroken.email.address@e2e-test.com';
export const VISUAL_PENDING_NAME = 'E2E Visual Pending User';
// Apartment without a user, listed on the users management page
export const VISUAL_UNASSIGNED_OWNER = 'E2E Visual Unassigned Owner';
export const VISUAL_UNASSIGNED_EMAIL = 'visual-unassigned@e2e-test.com';

// Passwords for accounts that tests create or reset. They are not seeded, so
// every spec that uses one imports it from here instead of repeating the literal.
export const E2E_PASSWORD = 'SecurePassword123!';
export const WRONG_PASSWORD = 'WrongPassword123!';
export const RESET_NEW_PASSWORD = 'BrandNewPassword456!';
