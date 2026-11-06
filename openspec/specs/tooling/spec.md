# Capability: Tooling

## Purpose

Defines the tools, package manager, frameworks, and code quality standards used across the project. All contributors and automated processes must use these tools consistently.

## Stack

- **Package manager**: pnpm
- **Framework**: Next.js 16 (App Router, TypeScript, standalone output)
- **Formatter**: Prettier
- **Linter**: ESLint (flat config)
- **Build tool / bundler**: Vite (via `@vitejs/plugin-react`, used by Vitest)
- **Unit test runner**: Vitest
- **E2E test runner**: Playwright

---

## Requirements

### Requirement: Package Manager

The project SHALL use pnpm as the sole package manager.

#### Scenario: Installing dependencies

- **GIVEN** a developer or CI environment setting up the project
- **WHEN** dependencies need to be installed
- **THEN** `pnpm install` is used; `npm install` and `yarn` are not used

#### Scenario: Running scripts

- **GIVEN** any npm script defined in `package.json`
- **WHEN** a developer or CI pipeline runs it
- **THEN** it is invoked with `pnpm <script>` (e.g., `pnpm dev`, `pnpm build`, `pnpm test`)

#### Scenario: pnpm overrides and build dependencies

- **GIVEN** the `pnpm` field in `package.json`
- **WHEN** pnpm resolves the dependency graph
- **THEN** `@auth/core` is resolved via the `overrides` field, and only the packages listed in `onlyBuiltDependencies` are permitted to run install scripts

---

### Requirement: Next.js

The project SHALL use Next.js with the App Router and TypeScript.

#### Scenario: Development server

- **GIVEN** a developer working locally
- **WHEN** they run `pnpm dev`
- **THEN** the Next.js development server starts with Turbopack enabled

#### Scenario: Production build

- **GIVEN** the project is built for deployment
- **WHEN** `pnpm build` is run
- **THEN** Next.js produces a `standalone` output suitable for Docker/container deployment

#### Scenario: External packages

- **GIVEN** server-side code using `pino` or `pino-pretty`
- **WHEN** the Next.js build processes server components and API routes
- **THEN** these packages are treated as `serverExternalPackages` and not bundled by Next.js

#### Scenario: Health check request logging suppressed

- **GIVEN** the Next.js logging configuration
- **WHEN** a request is made to `/api/health`
- **THEN** it is excluded from incoming request logs to avoid noise in production

#### Scenario: Deployment identifier

- **GIVEN** the `DEPLOYMENT_ID` environment variable is set during `pnpm build`
- **WHEN** the application runs on several replicas during a rolling update
- **THEN** the build carries that value as its deployment ID so a browser on an older deployment is detected and reloaded instead of failing on navigation

#### Scenario: Container image deployment identifier

- **GIVEN** the CI pipeline builds the container image
- **WHEN** the image is built
- **THEN** the commit SHA is passed as the `DEPLOYMENT_ID` build argument, so every tag of that image shares one deployment ID

#### Scenario: No deployment identifier locally

- **GIVEN** `DEPLOYMENT_ID` is not set
- **WHEN** the application is built or started for development or tests
- **THEN** no deployment ID is configured

### Requirement: Prettier

All source files SHALL be formatted with Prettier using the project configuration.

#### Scenario: Formatting on save / pre-commit

- **GIVEN** any staged `.js`, `.jsx`, `.ts`, `.tsx`, or `.mjs` file
- **WHEN** a git commit is made
- **THEN** `prettier --write` is run on it via lint-staged before the commit is recorded

#### Scenario: Prettier configuration

- **GIVEN** the `.prettierrc.json` file
- **WHEN** Prettier formats any file
- **THEN** it applies: single quotes, semicolons, trailing commas (`es5`), 80-character print width, 2-space indent, no tabs, `lf` line endings, and arrow function parentheses always

#### Scenario: JSON and Markdown formatting

- **GIVEN** staged `.json`, `.css`, or `.md` files
- **WHEN** a git commit is made
- **THEN** `prettier --write` is run on them via lint-staged

#### Scenario: Format check in CI

- **GIVEN** the CI pipeline
- **WHEN** `pnpm format:check` is run
- **THEN** Prettier exits non-zero if any file is not formatted correctly

---

### Requirement: ESLint

All source files SHALL pass ESLint with zero errors.

#### Scenario: Linting on pre-commit

- **GIVEN** any staged `.js`, `.jsx`, `.ts`, `.tsx`, or `.mjs` file
- **WHEN** a git commit is made
- **THEN** `eslint --fix` is run on it via lint-staged; the commit is blocked if unfixable errors remain

#### Scenario: Import sorting

- **GIVEN** any source file with import statements
- **WHEN** ESLint runs
- **THEN** `simple-import-sort` enforces alphabetical import order; violations are auto-fixed

#### Scenario: Unused imports

- **GIVEN** any source file
- **WHEN** ESLint runs
- **THEN** `unused-imports` reports and auto-removes unused import statements and unused variables (except those prefixed with `_`)

#### Scenario: No relative imports

- **GIVEN** any source file outside of `e2e/`
- **WHEN** ESLint runs
- **THEN** imports using `../` or `./` patterns are forbidden; the `@/` alias must be used instead (e.g., `@/components/...`)

#### Scenario: No duplicate imports

- **GIVEN** a file with multiple imports from the same module
- **WHEN** ESLint runs
- **THEN** `import/no-duplicates` reports them as an error; they must be merged into a single import statement

#### Scenario: Prettier rule enforced via ESLint

- **GIVEN** any source file
- **WHEN** ESLint runs
- **THEN** `eslint-plugin-prettier` reports formatting violations as ESLint errors, making Prettier the single source of formatting truth

#### Scenario: TypeScript `any` allowed in tests

- **GIVEN** a test file (`**/__tests__/**` or `**/*.test.ts/tsx`)
- **WHEN** ESLint runs
- **THEN** `@typescript-eslint/no-explicit-any` is disabled so test mocks can use `any` freely

#### Scenario: Playwright rules in E2E files

- **GIVEN** a file in `e2e/**`
- **WHEN** ESLint runs
- **THEN** `eslint-plugin-playwright` rules are applied: `expect-expect` is an error, `no-focused-test` is an error, `valid-expect` is an error, `no-conditional-in-test` is a warning, `no-skipped-test` is a warning, `no-wait-for-timeout` is a warning

---

### Requirement: Vite

Vite SHALL be used as the build and transform layer for unit tests via Vitest.

#### Scenario: React plugin

- **GIVEN** the `vitest.config.ts`
- **WHEN** Vitest processes `.tsx` files
- **THEN** `@vitejs/plugin-react` transforms JSX so React components can be imported and rendered in tests

#### Scenario: Path alias resolution

- **GIVEN** source files using `@/` imports
- **WHEN** Vitest resolves modules
- **THEN** `@` is aliased to `./src` in the Vite resolver config, mirroring the TypeScript `paths` config

---

### Requirement: Vitest

Unit and integration tests SHALL be run with Vitest.

#### Scenario: Running tests

- **GIVEN** a developer or CI environment
- **WHEN** `pnpm test` is run
- **THEN** Vitest runs all test files matching the default glob, excluding `e2e/`, `node_modules/`, and `.next/`

#### Scenario: Running tests once (CI mode)

- **GIVEN** a CI pipeline
- **WHEN** `pnpm test:coverage` is run
- **THEN** Vitest runs once (`--run`) and generates coverage reports in `text`, `json`, `json-summary`, `html`, and `lcov` formats under `./coverage/`

#### Scenario: Pre-commit test run

- **GIVEN** a git commit is triggered
- **WHEN** the `precommit` script runs
- **THEN** lint-staged runs first, then `vitest --run` executes the full unit test suite; the commit is blocked if any test fails

#### Scenario: Coverage thresholds

- **GIVEN** the coverage configuration in `vitest.config.ts`
- **WHEN** coverage is collected
- **THEN** lines, branches, functions, and statements must each reach 95%; Vitest fails if any threshold is not met

---

### Requirement: Playwright

End-to-end tests SHALL be run with Playwright against the Chromium browser.

#### Scenario: Running E2E tests locally

- **GIVEN** a running Next.js server (or reuse of an existing one)
- **WHEN** `pnpm test:e2e` is run
- **THEN** Playwright discovers all `*.spec.ts` files under `e2e/`, reuses an existing server at `http://localhost:3000` if available, and executes tests with up to 4 workers

#### Scenario: Running E2E tests in CI

- **GIVEN** the CI environment variable `CI=true`
- **WHEN** `pnpm test:e2e` is run
- **THEN** Playwright starts a fresh `pnpm dev` server, uses 4 workers, retries each failing test up to 2 times, and outputs GitHub Actions annotations alongside the HTML report

#### Scenario: Trace and screenshot on failure

- **GIVEN** a failing E2E test
- **WHEN** Playwright captures diagnostics
- **THEN** a trace is recorded on the first retry and a screenshot is taken on failure

#### Scenario: External services disabled

- **GIVEN** the Playwright `webServer` environment overrides
- **WHEN** the dev server is started for E2E tests
- **THEN** `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, and `SMTP_HOST` are set to empty strings so Cloudflare Turnstile and email sending are disabled

#### Scenario: Timeouts

- **GIVEN** the Playwright configuration
- **WHEN** tests run
- **THEN** each test has a 60-second timeout and each `expect` assertion has a 10-second timeout

### Requirement: Unarchived OpenSpec Change Check

The CI lint job SHALL fail when any directory other than `archive/` exists under `openspec/changes/`, independently of any lint cache.

#### Scenario: Open change blocks CI

- **GIVEN** a pull request that leaves `openspec/changes/<name>/` in place
- **WHEN** the CI lint job runs
- **THEN** the job fails and the error lists the unarchived change names

#### Scenario: No open changes

- **GIVEN** `openspec/changes/` contains only `archive/`
- **WHEN** the CI lint job runs
- **THEN** the check passes

#### Scenario: Cached lint results

- **GIVEN** the CI lint cache was restored from an earlier run
- **WHEN** a change directory has been added since
- **THEN** the check still fails, because it reads the directory on every run

### Requirement: Request-Time Streaming

Pages that load data SHALL send their layout and loading states without waiting for the
data, by placing request-time work (session, database) behind `Suspense` boundaries and
route `loading` states. The application SHALL NOT depend on Next.js Cache Components.

#### Scenario: Slow data

- **WHEN** a signed-in user requests a page whose data takes time to load
- **THEN** the first bytes of the response arrive before the data does and the sections follow as they resolve

#### Scenario: Production build

- **WHEN** the production build runs
- **THEN** it succeeds and every route is rendered on demand

### Requirement: Runtime Configuration At Request Time

Routes and components that read runtime environment variables SHALL opt into
request time so the values are not frozen into the build.

#### Scenario: Turnstile and Google configuration

- **GIVEN** the image was built without the variables and the container sets them
- **WHEN** `/api/config/turnstile` or `/api/config/google` is requested
- **THEN** the response reflects the container's values

#### Scenario: Tracking script

- **GIVEN** `TRACKING_SCRIPT` is set only at runtime
- **WHEN** any page is rendered
- **THEN** the page references `/api/tracking` as a deferred script
- **AND** `/api/tracking` returns the configured snippet as JavaScript, read on each request
- **AND** the layout and pages stay statically rendered

### Requirement: Module-Level Server Actions

Server Actions SHALL be exported functions of `'use server'` modules that receive
explicit, validated arguments. Inline actions that capture variables SHALL NOT be
used, so no closure is encrypted and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is not
required. Reads SHALL NOT use Server Actions. Server Actions SHALL live in
`src/actions/<feature>/` (for example `auth`, `account`, `users`, `apartments`,
`settings`) with their tests in that folder's `__tests__`.

#### Scenario: Inline action

- **GIVEN** a component that defines an action inside its body
- **WHEN** `pnpm lint` runs
- **THEN** it fails

#### Scenario: Three replicas, one image

- **WHEN** the same image runs on several replicas
- **THEN** an action invoked on any replica works without a shared encryption key

### Requirement: Client Reads With SWR

Data a Client Component fetches by itself SHALL be read with SWR through a `GET` route, using the shared options in `src/lib/swr`. A client-side config read such as the Google sign-in config SHALL also use SWR. A list seeded with server-loaded data SHALL NOT request that first page again on mount and SHALL sit in a `SwrScope`.

#### Scenario: Stable API write

- **GIVEN** a Client Component submits to a stable JSON API route such as `/api/admin/import`
- **WHEN** the mutation is written
- **THEN** it uses `useSWRMutation` with `jsonPoster` and the server's `error` message is shown on failure

#### Scenario: New write

- **GIVEN** a developer adds a mutation that is not a stable API route
- **WHEN** the mutation is written
- **THEN** it is a Server Action, not a `useSWRMutation` call

#### Scenario: Server-loaded first page

- **GIVEN** an admin list rendered with its first page from the server
- **WHEN** the list mounts and the admin loads more
- **THEN** only the following page is requested, and the first page is not fetched

#### Scenario: Revisiting a list

- **GIVEN** an admin changed a record and returns to a list they visited before
- **WHEN** the page renders
- **THEN** the list shows the data the server just loaded, not a cached earlier page

#### Scenario: Shared options

- **GIVEN** a client query
- **WHEN** the window regains focus or the network reconnects
- **THEN** nothing is refetched, and a failed request is shown instead of being retried in the background

#### Scenario: Changed query

- **GIVEN** a list with several pages loaded
- **WHEN** the search text or a filter changes
- **THEN** the list starts again from the first page of the new query and ignores responses to the old one

### Requirement: Client Writes Are Server Actions

Mutations SHALL be Server Actions, except the stable JSON API write routes `/api/admin/import` and `/api/admin/import/validate`, which SHALL be sent with `useSWRMutation` using the shared `jsonPoster` fetcher. Public (signed-out) mutations SHALL be Server Actions that carry a file-level `eslint-disable local/require-action-auth-guard` comment stating the reason.

#### Scenario: Validation route uses the shared poster

- **GIVEN** a Client Component that submits to `/api/admin/import/validate`
- **WHEN** the mutation is written
- **THEN** it uses `useSWRMutation` with `jsonPoster`

#### Scenario: Public mutation is a guarded-exempt Server Action

- **GIVEN** a signed-out registration mutation
- **WHEN** it is written
- **THEN** it is a Server Action whose module carries the file-level disable comment with a reason

### Requirement: E2E Mock Server

The repository SHALL contain a local mock server for E2E that Playwright and Docker Compose both start.

#### Scenario: Mock services

- **GIVEN** the mock server is running
- **WHEN** a test or the app talks to it
- **THEN** it provides an SMTP endpoint that stores received messages, an HTTP API to list and clear messages by recipient, an OIDC provider for Google sign-in, and the Turnstile siteverify endpoint

#### Scenario: Started with the suite

- **GIVEN** `pnpm test:e2e` is run locally
- **WHEN** Playwright starts its web servers
- **THEN** the mock server is started first and reused if already running; in Docker Compose it runs as its own service

#### Scenario: Mock server runs standalone

- **GIVEN** a developer wants the mocks without Playwright or Docker
- **WHEN** they run `pnpm mocks`
- **THEN** the mock server starts with the same entry point as the mocks image, on ports 4010 (HTTP) and 1025 (SMTP)

#### Scenario: Mocks image ships only mock runtime dependencies

- **GIVEN** the mocks image is built from `docker/Dockerfile.mocks`
- **WHEN** its dependencies are installed
- **THEN** only the production dependencies of the `e2e/mocks` workspace package are copied into the image, not the application's development dependencies

#### Scenario: Mock server logging

- **GIVEN** the mock server is running
- **WHEN** it handles a request, captures an email, issues or exchanges a Google code, verifies a Turnstile token, or hits an error
- **THEN** it writes a JSON log line through pino with a `name` of `mock:<subsystem>` (`mock:http`, `mock:smtp`, `mock:google`, `mock:turnstile`), filtered by `LOG_LEVEL` (default `info`)
- **AND** request lines carry method, path (without the query string), status and duration, and health probes log at `debug`
- **AND** log lines never contain email bodies, Turnstile tokens, authorization codes or access tokens

#### Scenario: Browser-side Turnstile

- **GIVEN** a spec on the integrations app
- **WHEN** the page requests the Cloudflare widget script
- **THEN** Playwright serves a mock script that issues a valid or an invalid token, so the production CSP is unchanged
