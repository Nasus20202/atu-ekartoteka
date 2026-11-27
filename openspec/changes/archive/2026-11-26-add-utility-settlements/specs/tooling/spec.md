# Spec Delta

## MODIFIED Requirements

### Requirement: Client Writes Are Server Actions

Mutations SHALL be Server Actions, except the stable JSON API write routes `/api/admin/import`, `/api/admin/import/validate`, `/api/admin/import/settlements` and `/api/admin/import/settlements/preview`, which SHALL be sent with `useSWRMutation` using the shared `jsonPoster` fetcher. Public (signed-out) mutations SHALL be Server Actions that carry a file-level `eslint-disable local/require-action-auth-guard` comment stating the reason.

#### Scenario: Validation route uses the shared poster

- **GIVEN** a Client Component that submits to `/api/admin/import/validate`
- **WHEN** the mutation is written
- **THEN** it uses `useSWRMutation` with `jsonPoster`

#### Scenario: Public mutation is a guarded-exempt Server Action

- **GIVEN** a signed-out registration mutation
- **WHEN** it is written
- **THEN** it is a Server Action whose module carries the file-level disable comment with a reason

#### Scenario: Settlement routes use the shared poster

- **GIVEN** a Client Component that submits settlement files
- **WHEN** the mutation is written
- **THEN** it uses `useSWRMutation` with `jsonPoster`
