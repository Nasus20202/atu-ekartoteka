# Capability: DB Migration

## Purpose

Ensures database schema migrations are applied safely, preserving existing data without loss and following a structured process for destructive or non-nullable changes.

## Requirements

### Requirement: Data-Safe Migrations

The system SHALL ensure all database schema migrations preserve existing data without loss.

#### Scenario: New nullable column preserves existing rows

- **WHEN** a migration adds a new nullable column to an existing table
- **THEN** all existing rows remain valid with `NULL` in the new column and no data is lost

#### Scenario: New column with default preserves existing rows

- **WHEN** a migration adds a new non-nullable column with a `@default` value
- **THEN** all existing rows receive the default value and no data is lost

#### Scenario: Non-nullable column without default requires backfill

- **WHEN** a migration must add a non-nullable column with no safe default
- **THEN** a two-step process is used: (1) add as nullable, (2) backfill all rows, (3) apply NOT NULL constraint — and the migration is never deployed before backfill completes

#### Scenario: Destructive change requires documented plan

- **WHEN** a migration drops a column, renames a column, or changes a column type
- **THEN** a backfill or archival plan is documented and executed before the destructive step is applied

### Requirement: Database Connection Pool

The application SHALL size each Prisma client's connection pool from the `DATABASE_POOL_MAX` and `DATABASE_POOL_CONNECTION_TIMEOUT_MS` environment variables, defaulting to 10 connections and a 5000 ms wait for a free connection.

#### Scenario: Defaults apply when variables are unset

- **GIVEN** neither `DATABASE_POOL_MAX` nor `DATABASE_POOL_CONNECTION_TIMEOUT_MS` is set
- **WHEN** the application starts
- **THEN** each database client uses a pool of at most 10 connections
- **AND** a request waiting longer than 5000 ms for a free connection fails instead of queueing indefinitely

#### Scenario: Invalid values fall back to the defaults

- **GIVEN** `DATABASE_POOL_MAX` is set to a value that is not a positive integer
- **WHEN** the application starts
- **THEN** the default pool size is used

#### Scenario: Each read replica has its own pool

- **GIVEN** `DATABASE_REPLICA_URLS` lists replicas
- **WHEN** the application starts
- **THEN** the pool size applies to the primary and to each replica separately
