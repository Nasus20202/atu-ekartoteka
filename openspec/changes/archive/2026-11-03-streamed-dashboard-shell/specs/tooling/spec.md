## ADDED Requirements

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

### Requirement: Client Reads With SWR

Data a Client Component fetches by itself SHALL be read with SWR through a `GET` route, using the shared options in `src/lib/swr`. Mutations SHALL be Server Actions. A list seeded with server-loaded data SHALL NOT request that first page again on mount and SHALL sit in a `SwrScope`.

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
