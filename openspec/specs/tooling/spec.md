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

---

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
- **THEN** lines, branches, functions, and statements must each reach 80%; Vitest fails if any threshold is not met

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
- **THEN** Playwright starts a fresh `pnpm dev` server, uses 2 workers, retries each failing test up to 2 times, and outputs GitHub Actions annotations alongside the HTML report

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
