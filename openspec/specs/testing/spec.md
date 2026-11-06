# Capability: Testing

## Purpose

Defines the testing strategy, tooling, and conventions for the application. All business logic must be covered by unit tests, and all user flows must be covered by end-to-end tests.

## Stack

- **Unit / integration tests**: Vitest + React Testing Library (`vitest.config.ts`)
- **E2E tests**: Playwright (`playwright.config.ts`)
- **Performance tests**: k6 (`perf/`), see `openspec/specs/performance-testing/spec.md`
- **Coverage threshold**: 95% lines, branches, functions, and statements (enforced by Vitest)

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
- **THEN** line, branch, function, and statement coverage must each be at or above 95%

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
  - `e2e/auth/` — login, registration, email verification, password reset, logout, orphaned session, access control
  - `e2e/admin/` — user management, apartment management, HOA operations, data import
  - `e2e/dashboard/` — tenant dashboard, charges, payments, profile

#### Scenario: E2E file naming

- **GIVEN** an E2E test file
- **WHEN** it is created
- **THEN** it is named `<feature>.spec.ts`

---

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

### Requirement: E2E Test Scope

The system SHALL have end-to-end tests covering all primary user flows.

#### Scenario: Authentication flows

- **GIVEN** the auth E2E suite
- **WHEN** it runs
- **THEN** it covers: credentials login, Google OAuth (where applicable), user registration, email verification, password reset, logout, orphaned-session sign-out, and route-level access control

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

The system SHALL run the functional E2E tests on Chromium, Firefox and WebKit, each as its own desktop project and as a separate CI job.

#### Scenario: Browser projects

- **GIVEN** the Playwright configuration
- **WHEN** tests are executed
- **THEN** the `chromium`, `firefox` and `webkit` projects run the same functional tests on their `Desktop Chrome`, `Desktop Firefox` and `Desktop Safari` profiles, with the admin tests in matching `*-admin` projects

#### Scenario: Phone projects

- **GIVEN** the Playwright configuration
- **WHEN** tests are executed
- **THEN** the `webkit-mobile` project runs the functional tests, except the cron tests, on the `iPhone 13` profile, and the `firefox-mobile` project runs them on Firefox at a phone viewport without touch emulation

#### Scenario: Default local run is Chromium only

- **GIVEN** a developer machine
- **WHEN** `pnpm test:e2e` is run
- **THEN** only the Chromium-based projects (`chromium*` and `visual-*`) run, and Firefox and WebKit run through `pnpm test:e2e:firefox`, `pnpm test:e2e:webkit` or the CI matrix

#### Scenario: Browser matrix in CI

- **GIVEN** the E2E workflow runs in CI
- **WHEN** it starts
- **THEN** each browser runs in its own job with its own database stack, so the browsers run in parallel
- **AND** the Chromium job starts the functional, visual and integrations apps with the mocks, while the Firefox and WebKit jobs start only the database and the functional app
- **AND** the build workflow builds the mocks image in parallel with the app image and uploads it, so the Chromium job loads it instead of building it

#### Scenario: WebKit renders at scale factor 1

- **GIVEN** the `webkit`, `webkit-admin` and `webkit-mobile` projects
- **WHEN** they run
- **THEN** they use a device scale factor of 1 instead of the 2x and 3x of the Safari profiles, so software rendering on the CI runner can keep up

#### Scenario: Visual tests stay on Chromium

- **GIVEN** the visual regression projects
- **WHEN** they run
- **THEN** they run only on Chromium, because screenshot baselines are stored per browser

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

---

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

### Requirement: Streaming-Tolerant E2E Locators

End-to-end tests SHALL NOT assume a page contains one copy of its content right
after navigation. Locators that match text or inputs SHALL be visibility-aware, and
page navigation helpers SHALL wait for streamed content to settle and for
hydration before interacting.

#### Scenario: Navigating to a streamed page

- **WHEN** a test navigates to a page whose sections stream in
- **THEN** it interacts only after hidden streaming segments are gone

### Requirement: Email Template Tests

Email templates SHALL be covered by unit tests and visual screenshot tests.

#### Scenario: Unit tests per template

- **GIVEN** each of the five template pairs
- **WHEN** the unit tests run
- **THEN** they assert that all placeholders are substituted, user-supplied values are HTML-escaped in HTML and left as is in text, links are absolute and based on `APP_URL`, and the text variant contains the same links and values

#### Scenario: Plain-text bodies are pinned

- **GIVEN** each of the five email types rendered with fixed inputs
- **WHEN** the unit tests run
- **THEN** the complete plain-text body is compared with a stored snapshot, so any wording or layout change fails until the snapshot is updated

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

### Requirement: PDF Visual Regression Tests

The system SHALL keep pixel-level regression tests for the generated PDF documents in `e2e/visual/`. The tests SHALL render every page of each PDF to an image and compare it with a committed baseline image, at the desktop viewport only.

#### Scenario: PDF documents are covered

- **GIVEN** the visual suite
- **WHEN** it runs
- **THEN** the charge, payment, and current notice PDFs each have at least one rendered-page comparison

#### Scenario: Pixel differences fail the test

- **GIVEN** a rendered PDF page that differs from its baseline by more than the configured tolerance
- **WHEN** the visual test runs
- **THEN** the test fails and the actual image is written to the test results

#### Scenario: Visual app fixes the clock

- **GIVEN** a PDF test running against the visual app
- **WHEN** the PDF is generated
- **THEN** the app uses the fixed clock so the printed date matches the baseline on any day
