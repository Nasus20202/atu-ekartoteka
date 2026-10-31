## MODIFIED Requirements

### Requirement: E2E Test Infrastructure

The system SHALL provide global setup and teardown that prepares a known database state before each E2E run. E2E code that queries the database directly SHALL load its SQL from files in `e2e/test-data/seed/`.

#### Scenario: Database seeding before run

- **GIVEN** the E2E suite is about to start
- **WHEN** `e2e/global-setup.ts` runs
- **THEN** existing test data is cleaned and a deterministic seed is applied so every run starts from the same state

#### Scenario: Database teardown after run

- **GIVEN** the E2E suite has finished
- **WHEN** `e2e/global-teardown.ts` runs
- **THEN** test data is cleaned from the database

#### Scenario: External services disabled during E2E

- **GIVEN** the Playwright web server configuration
- **WHEN** E2E tests run
- **THEN** Cloudflare Turnstile (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) and SMTP (`SMTP_HOST`) are disabled via environment overrides so UI flows are not blocked by external services

#### Scenario: Test data SQL kept in files

- **GIVEN** an E2E helper or spec that reads or writes the database directly
- **WHEN** it runs a query
- **THEN** the SQL is loaded from a file in `e2e/test-data/seed/` with `loadSql`, not written inline in TypeScript
