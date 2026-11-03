## ADDED Requirements

### Requirement: Cache Components

The application SHALL run with Next.js Cache Components and partial
prefetching enabled. Routes that cannot be prerendered yet SHALL opt out
explicitly instead of failing the build.

#### Scenario: Build with Cache Components

- **WHEN** the production build runs
- **THEN** it succeeds and the dashboard route has a prerendered static shell

#### Scenario: Route that is not migrated

- **GIVEN** a route reads the session before rendering
- **WHEN** the production build runs
- **THEN** the route is explicitly marked as not prerendered and still works as before

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
