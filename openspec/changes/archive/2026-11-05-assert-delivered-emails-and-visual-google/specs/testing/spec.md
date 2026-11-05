# Spec Delta

## ADDED Requirements

### Requirement: Delivered Email Assertions

Integration specs that cause an email to be sent SHALL assert the message captured by the SMTP mock, not only the flow that follows it.

#### Scenario: Whole message is checked

- **GIVEN** an email captured by the SMTP mock
- **WHEN** a spec asserts it
- **THEN** it checks the recipient, the sender address, the exact subject, that the HTML and text parts are both non-empty and free of unresolved placeholders, that the expected content and the brand and primary colour are present, that every link in the HTML is on the app origin and also appears in the text part, and that the call-to-action link is present in both parts

#### Scenario: Every email type is delivered

- **GIVEN** the integrations app
- **WHEN** a user registers, a password reset is requested, an admin approves an account, a user signs in with Google for the first time, or an admin bulk-creates accounts
- **THEN** the verification, password reset, account approved, admin notification and account activation emails are each captured and asserted, and the activation email's temporary password signs the owner in

### Requirement: Login Snapshot Shows Google Sign-In

The login page visual tests SHALL render the Google sign-in button.

#### Scenario: Login snapshots

- **GIVEN** the visual app with Google credentials configured
- **WHEN** the login page is snapshotted in light and dark mode at desktop and phone viewports
- **THEN** the specs assert the Google button is visible and the snapshots include it

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
- **THEN** Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and SMTP (`SMTP_HOST`) are disabled via environment overrides on both, and Google sign-in is disabled on the functional app, so UI flows are not blocked by external services

#### Scenario: Visual app shows the Google button

- **GIVEN** the visual app server
- **WHEN** it is started
- **THEN** it has dummy Google client credentials, so the login page renders the Google button, and no flow ever contacts Google

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
