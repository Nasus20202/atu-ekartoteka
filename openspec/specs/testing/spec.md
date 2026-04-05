# Capability: Testing

## Purpose

Defines the testing strategy, tooling, and conventions for the application. All business logic must be covered by unit tests, and all user flows must be covered by end-to-end tests.

## Stack

- **Unit / integration tests**: Vitest + React Testing Library (`vitest.config.ts`)
- **E2E tests**: Playwright (`playwright.config.ts`)
- **Coverage threshold**: 80% lines, branches, functions, and statements (enforced by Vitest)

---

## Requirements

### Requirement: Unit Test Placement

The system SHALL co-locate unit and integration tests with the implementation files they cover.

#### Scenario: Business logic test location

- **GIVEN** a module with business logic (API route, parser, importer, utility, React component)
- **WHEN** tests are written for it
- **THEN** the test file is placed in a `__tests__` folder adjacent to the implementation file, not in a centralised test directory

#### Scenario: Test file naming

- **GIVEN** an implementation file (e.g., `route.ts`, `parser.ts`, `MyComponent.tsx`)
- **WHEN** a test file is created for it
- **THEN** the test file is named `<implementation-name>.test.ts` (or `.test.tsx` for React components)

---

### Requirement: Unit Test Scope

The system SHALL have unit tests for all non-trivial business logic.

#### Scenario: API route handler tests

- **GIVEN** an API route handler (Next.js App Router `route.ts`)
- **WHEN** tests are written
- **THEN** each HTTP method is tested with mocked dependencies (Prisma, auth session, email), covering success paths, error paths, and authorization checks

#### Scenario: Parser and importer tests

- **GIVEN** a file parser or importer (e.g., LOK, NAL-CZYNSZ, WPLATY parsers)
- **WHEN** tests are written
- **THEN** representative input files or strings are used to verify output shape and edge cases (empty input, malformed lines, encoding issues)

#### Scenario: React component tests

- **GIVEN** a React component with conditional rendering, form validation, or user interaction logic
- **WHEN** tests are written
- **THEN** React Testing Library is used to assert rendered output and user events, without testing implementation details

#### Scenario: Coverage threshold

- **GIVEN** the full test suite runs with coverage enabled
- **WHEN** the coverage report is generated
- **THEN** line, branch, function, and statement coverage must each be at or above 80%

---

### Requirement: Unit Test Infrastructure

The system SHALL provide a shared setup for all unit tests.

#### Scenario: jsdom environment

- **GIVEN** any unit test file
- **WHEN** the test runs
- **THEN** the DOM environment is jsdom (configured in `vitest.config.ts`) so React components can be rendered without a browser

#### Scenario: Global test setup

- **GIVEN** tests that assert DOM state
- **WHEN** the suite initialises
- **THEN** `@testing-library/jest-dom` matchers are loaded via `src/__tests__/setup.ts`, so assertions like `toBeInTheDocument()` are available globally

---

### Requirement: E2E Test Placement

The system SHALL store all end-to-end tests in the `e2e/` directory, organised by feature area.

#### Scenario: E2E directory structure

- **GIVEN** end-to-end tests covering different parts of the application
- **WHEN** new specs are added
- **THEN** they are placed in a subdirectory matching the feature area:
  - `e2e/auth/` — login, registration, email verification, password reset, logout, access control
  - `e2e/admin/` — user management, apartment management, HOA operations, data import
  - `e2e/dashboard/` — tenant dashboard, charges, payments, profile

#### Scenario: E2E file naming

- **GIVEN** an E2E test file
- **WHEN** it is created
- **THEN** it is named `<feature>.spec.ts`

---

### Requirement: E2E Test Infrastructure

The system SHALL provide global setup and teardown that prepares a known database state before each E2E run.

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

---

### Requirement: E2E Test Scope

The system SHALL have end-to-end tests covering all primary user flows.

#### Scenario: Authentication flows

- **GIVEN** the auth E2E suite
- **WHEN** it runs
- **THEN** it covers: credentials login, Google OAuth (where applicable), user registration, email verification, password reset, logout, and route-level access control

#### Scenario: Admin flows

- **GIVEN** the admin E2E suite
- **WHEN** it runs
- **THEN** it covers: listing and searching users, approving/rejecting users, listing/searching apartments, assigning apartments to users, and uploading import files

#### Scenario: Tenant dashboard flows

- **GIVEN** the dashboard E2E suite
- **WHEN** it runs
- **THEN** it covers: viewing assigned apartments, browsing charges and payments per apartment, and updating the user profile

---

### Requirement: E2E Browser Target

The system SHALL run E2E tests against Chromium by default.

#### Scenario: Single browser project

- **GIVEN** the Playwright configuration
- **WHEN** tests are executed
- **THEN** they run on the `Desktop Chrome` Chromium profile; additional browser projects may be added as the matrix grows

---

### Requirement: CI Behaviour

The system SHALL enforce stricter test behaviour in continuous integration environments.

#### Scenario: No `.only` in CI

- **GIVEN** the Playwright configuration with `forbidOnly: !!process.env.CI`
- **WHEN** a test file containing `test.only` or `describe.only` is pushed
- **THEN** the CI run fails immediately

#### Scenario: Retries in CI

- **GIVEN** a flaky E2E test in CI
- **WHEN** it fails on the first attempt
- **THEN** Playwright retries it up to 2 times before marking it as failed; no retries occur locally
