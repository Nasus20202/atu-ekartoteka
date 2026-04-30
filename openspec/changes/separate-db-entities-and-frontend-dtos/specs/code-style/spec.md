## ADDED Requirements

### Requirement: Named DTOs at Frontend Boundaries

Data passed from server-side database/query composition into client components,
other frontend-only rendering boundaries, or internal JSON API responses
consumed by the frontend SHALL use named DTO types and dedicated mapping
functions.

#### Scenario: Server page passes data to client component

- **WHEN** a server page or server component prepares database-backed data for a
  client component
- **THEN** it maps that data through a dedicated DTO mapper
- **AND** the receiving component props are typed with a named DTO instead of a
  database entity type or an unnamed serialized object shape

#### Scenario: Frontend-safe conversion is needed for Decimal or Date fields

- **WHEN** a boundary requires conversion of `Decimal`, `Date`, or other
  non-plain values into frontend-safe props
- **THEN** the conversion happens in a dedicated DTO mapper module
- **AND** the module naming reflects the DTO contract rather than a generic
  `serialize*` helper

#### Scenario: Query modules remain database-focused

- **WHEN** a feature needs both database-shaped records and frontend-safe props
- **THEN** the query module continues to return database-oriented data
- **AND** the DTO mapping is applied in the caller or a dedicated boundary
  mapper rather than inside the query itself

#### Scenario: Route handler returns database-backed JSON

- **WHEN** an internal route handler returns user, apartment, charge, payment,
  or similar domain data for frontend consumption
- **THEN** it maps the response through a named DTO helper before calling
  `NextResponse.json`
- **AND** the handler does not expose raw Prisma-selected record shapes as the
  route contract
