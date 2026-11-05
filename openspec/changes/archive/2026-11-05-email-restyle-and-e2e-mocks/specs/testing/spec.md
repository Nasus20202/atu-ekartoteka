# Spec Delta

## ADDED Requirements

### Requirement: Email Template Tests

Email templates SHALL be covered by unit tests and visual screenshot tests.

#### Scenario: Unit tests per template

- **GIVEN** each of the five template pairs
- **WHEN** the unit tests run
- **THEN** they assert that all placeholders are substituted, user-supplied values are HTML-escaped in HTML and left as is in text, links are absolute and based on `APP_URL`, and the text variant contains the same links and values

#### Scenario: Email screenshots

- **GIVEN** the visual suite
- **WHEN** it runs
- **THEN** each email is rendered with fixed variables and compared with a stored screenshot at desktop and phone viewports

### Requirement: Integration E2E Specs

E2E specs in `e2e/integrations/` SHALL exercise SMTP, Google sign-in and Turnstile against local mocks.

#### Scenario: Emails are delivered

- **GIVEN** the integrations app with SMTP pointing at the mock
- **WHEN** a user registers, requests a password reset, or an admin approves an account
- **THEN** the spec reads the captured message for that recipient and follows its link to complete the flow

#### Scenario: Google sign-in

- **GIVEN** the Google mock configured with a user
- **WHEN** the user clicks the Google button on the login page
- **THEN** they are redirected through the mock and land in the application with the expected account state

#### Scenario: Turnstile outcomes

- **GIVEN** the Turnstile mock returns success or failure
- **WHEN** a user submits login or registration
- **THEN** the action succeeds with a valid token and is rejected with an invalid one

## MODIFIED Requirements

### Requirement: E2E Test Infrastructure

The system SHALL provide global setup and teardown that prepares known database states before each E2E run: the functional database `e2e` and the visual database `e2e_visual`. E2E code that queries the database directly SHALL load its SQL from files in `e2e/test-data/seed/`.

#### Scenario: Database seeding before run

- **GIVEN** the E2E suite is about to start
- **WHEN** `e2e/global-setup.ts` runs
- **THEN** the functional database and `e2e_visual` are created if missing, migrated, cleaned and seeded, so every run starts from the same state

#### Scenario: Database teardown after run

- **GIVEN** the E2E suite has finished
- **WHEN** `e2e/global-teardown.ts` runs
- **THEN** test data is cleaned from both databases

#### Scenario: External services disabled during E2E

- **GIVEN** the functional and visual app servers
- **WHEN** E2E tests run
- **THEN** Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`), SMTP (`SMTP_HOST`) and Google sign-in are disabled via environment overrides so UI flows are not blocked by external services

#### Scenario: External services mocked on the integrations server

- **GIVEN** the integrations app server
- **WHEN** it is started
- **THEN** SMTP, Turnstile and Google are enabled and point at the local mock server, never at the real services

#### Scenario: Test data SQL kept in files

- **GIVEN** an E2E helper or spec that reads or writes the database directly
- **WHEN** it runs a query
- **THEN** the SQL is loaded from a file in `e2e/test-data/seed/` with `loadSql`, not written inline in TypeScript

#### Scenario: Functional and visual data are separate

- **GIVEN** the functional and visual suites run in the same invocation
- **WHEN** functional specs create, change or delete users and apartments
- **THEN** they write only to the `e2e` database, the functional seed creates no visual users, and visual tests read only `e2e_visual`

#### Scenario: Two app servers during local runs

- **GIVEN** a developer runs the E2E suite from one checkout without `PLAYWRIGHT_SKIP_WEBSERVER`
- **WHEN** the E2E script runs the production build and Playwright starts its web servers
- **THEN** the same build is served by `next start` for the functional app on port 3000 against `e2e`, the visual app on port 3001 against `e2e_visual`, and the integrations app on port 3002 against `e2e`
