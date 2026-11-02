# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
