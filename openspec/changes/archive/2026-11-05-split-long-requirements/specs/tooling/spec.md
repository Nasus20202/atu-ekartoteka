# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
