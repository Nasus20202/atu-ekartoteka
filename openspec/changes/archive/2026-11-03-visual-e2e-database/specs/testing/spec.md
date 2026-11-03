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

- **GIVEN** the Playwright web server configuration
- **WHEN** E2E tests run
- **THEN** Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and SMTP (`SMTP_HOST`) are disabled via environment overrides so UI flows are not blocked by external services

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
- **THEN** the same build is served twice by `next start`: the functional app on port 3000 against `e2e`, and the visual app on port 3001 against `e2e_visual`

## ADDED Requirements

### Requirement: Visual Regression Tests

The system SHALL keep visual regression tests for the admin and tenant pages in `e2e/visual/`. These tests run against the visual app and its own database, so the data on screen is fixed.

#### Scenario: Admin pages are covered

- **GIVEN** the visual suite
- **WHEN** it runs
- **THEN** each admin page has a screenshot test at desktop and phone viewports: the HOA list, HOA apartments, apartment details, import, settings, users (pending, all as cards, all as a table, dark mode, create-user dialog) and users management

#### Scenario: Admin pages do not scroll horizontally

- **GIVEN** an admin visual test running on a phone viewport
- **WHEN** the page has finished loading
- **THEN** the document is no wider than the viewport

#### Scenario: Snapshot dates are stable

- **GIVEN** seeded visual users
- **WHEN** a snapshot shows their registration date
- **THEN** the creation timestamp is pinned in the seed, so the snapshot does not change between days
