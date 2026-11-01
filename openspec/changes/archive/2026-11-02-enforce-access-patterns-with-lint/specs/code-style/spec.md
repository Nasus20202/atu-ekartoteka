# Spec Delta

## ADDED Requirements

### Requirement: Access predicate usage

Account status and role decisions SHALL go through the shared predicates in `src/lib/auth/`. Comparing a `status` or `role` value against `AccountStatus.APPROVED` or `UserRole.ADMIN` outside those modules SHALL be a lint error.

#### Scenario: Direct admin comparison

- **GIVEN** a source file outside `src/lib/auth/`
- **WHEN** it compares a `role` value with `UserRole.ADMIN`
- **THEN** ESLint reports `local/prefer-access-helpers` and the build fails

#### Scenario: Direct approval comparison

- **GIVEN** a source file outside `src/lib/auth/`
- **WHEN** it compares a `status` value with `AccountStatus.APPROVED`
- **THEN** ESLint reports `local/prefer-access-helpers` and names the predicate to use

#### Scenario: Predicate modules

- **GIVEN** the modules that define the predicates
- **WHEN** they compare against the enum members
- **THEN** ESLint accepts the comparison, so the rule has exactly one home

#### Scenario: Other status values

- **GIVEN** presentation code that maps `PENDING` or `REJECTED` to a label
- **WHEN** it compares against those enum members
- **THEN** ESLint does not report an error

### Requirement: No raw SQL

Application code SHALL NOT use Prisma raw SQL. Raw SQL is allowed only in migration files.

#### Scenario: Raw query in an API route

- **GIVEN** a source file under `src/`
- **WHEN** it calls `$queryRaw`, `$queryRawUnsafe`, `$queryRawTyped`, `$executeRaw` or `$executeRawUnsafe`
- **THEN** ESLint reports `local/no-raw-sql` and the build fails

#### Scenario: Query API

- **GIVEN** a database call written with the Prisma query API
- **WHEN** ESLint runs
- **THEN** no error is reported
