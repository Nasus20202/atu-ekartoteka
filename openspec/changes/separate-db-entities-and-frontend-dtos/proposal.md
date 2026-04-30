## Why

The current charges and payments flow passes database-shaped entities into server
components and then relies on ad-hoc `serialize*` helpers to coerce them into
frontend-safe values. In addition, several internal API routes still return raw
query or mutation results for users and apartments. That mixes persistence
concerns with presentation contracts, makes data boundaries hard to reason
about, and encourages new UI code to depend on database entity shapes instead
of explicit DTOs.

## What Changes

- Replace the current `serializePayment` and `serializeCharge` helpers with
  explicit DTO mappers that convert DB/query results into frontend-facing data
  contracts.
- Keep database reads and writes in `queries/` and `mutations/` returning
  database-oriented shapes, while pages, components, and PDF/export entry points
  consume DTOs instead of Prisma-like entities.
- Introduce dedicated DTO types for the existing charges and payments views,
  including the decimal and date fields that currently require serialization.
- Update the affected charges/payments pages, lists, tables, and PDF components
  to depend on DTOs with clear names rather than `Serializable*` aliases.
- Add dedicated DTO types for internal user and apartment API responses so route
  handlers return stable frontend-facing payloads instead of raw database-shaped
  objects.
- Remove the old serializer modules once all current call sites use DTO
  mappers.

## Capabilities

### New Capabilities

- `frontend-dto-boundaries`: define explicit frontend data-transfer contracts
  for server-to-UI boundaries where DB entities cannot be passed through
  directly.

### Modified Capabilities

- `charges-and-payments`: charge and payment views must keep their current
  behaviour while sourcing display data from explicit DTOs instead of
  serializer-shaped entity clones.
- `user-and-apartment-management`: admin and profile API responses must use
  explicit DTO contracts when returning user or apartment data to frontend
  consumers.
- `code-style`: data crossing from database/query code into frontend rendering
  paths or API response boundaries must use named DTOs and dedicated mapping
  helpers rather than ad-hoc entity serialization functions.

## Impact

**Code:**

- `src/lib/payments/serialize-payment.ts` and
  `src/lib/charges/serialize-charge.ts` will be replaced by DTO-focused modules
  and mappers.
- Charges and payments pages under `src/app/dashboard/**` and related
  components/PDF entry points will switch to DTO types.
- Internal API routes under `src/app/api/admin/**` and `src/app/api/user/**`
  that currently return raw user/apartment records will map those payloads
  through DTO helpers.
- Relevant query files under `src/lib/queries/users/` and
  `src/lib/queries/apartments/` may need small shape-selection updates to keep
  mapper inputs explicit and stable.
- Existing serializer tests will move to DTO mapper tests; affected UI tests
  will be updated to use DTO fixtures.

**APIs:**

- Internal route responses for user and apartment management will become
  explicitly DTO-shaped while preserving current frontend behaviour.

**Dependencies:** none.

## Non-goals

- Broad repository-wide DTO adoption outside the current charges/payments and
  user/apartment management flows.
- Changing user-visible behaviour, formatting, or business rules for charges,
  payments, user management, apartment management, or PDF exports.
- Moving database reads out of existing `queries/` files unless a touched call
  site already violates the current data-access rule.
