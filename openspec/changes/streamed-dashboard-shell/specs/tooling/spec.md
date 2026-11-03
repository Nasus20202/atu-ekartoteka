## ADDED Requirements

### Requirement: Cache Components

The application SHALL run with Next.js Cache Components and partial
prefetching enabled. Request-time work (session, database) SHALL sit behind a
loading boundary so the build prerenders a shell for every route.

#### Scenario: Build with Cache Components

- **WHEN** the production build runs
- **THEN** it succeeds and the dashboard route has a prerendered static shell

#### Scenario: Request-time access

- **GIVEN** a page that reads the session
- **WHEN** the production build runs
- **THEN** the read sits behind a loading boundary and the build does not fail

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
- **THEN** the tracking script is included

### Requirement: Module-Level Server Actions

Server Actions SHALL be exported functions of `'use server'` modules that receive
explicit, validated arguments. Inline actions that capture variables SHALL NOT be
used, so no closure is encrypted and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is not
required. Reads SHALL NOT use Server Actions.

#### Scenario: Inline action

- **GIVEN** a component that defines an action inside its body
- **WHEN** `pnpm lint` runs
- **THEN** it fails

#### Scenario: Three replicas, one image

- **WHEN** the same image runs on several replicas
- **THEN** an action invoked on any replica works without a shared encryption key
