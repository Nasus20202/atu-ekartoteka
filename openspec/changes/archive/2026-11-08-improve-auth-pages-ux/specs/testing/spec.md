# Spec Delta

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
- **THEN** Cloudflare Turnstile and SMTP (`SMTP_HOST`) are disabled via environment overrides on the functional server, SMTP is disabled on the visual server, and Google sign-in is disabled on the functional app, so UI flows are not blocked by external services

#### Scenario: Visual app shows the Google button

- **GIVEN** the visual app server
- **WHEN** it is started
- **THEN** it has dummy Google client credentials, so the login page renders the Google button, and no flow ever contacts Google

#### Scenario: Visual app stubs the Turnstile widget

- **GIVEN** the visual app server with dummy Turnstile credentials
- **WHEN** a visual test opens an auth page
- **THEN** the Cloudflare `api.js` request is intercepted and replaced with a visible, deterministic fake widget that never solves itself or contacts Cloudflare, so the challenge slot is part of the snapshot

#### Scenario: External services mocked on the integrations server

- **GIVEN** the integrations app server
- **WHEN** it is started
- **THEN** SMTP, Turnstile, Google and OpenTelemetry export are enabled and point at the local mock server, never at the real services

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
