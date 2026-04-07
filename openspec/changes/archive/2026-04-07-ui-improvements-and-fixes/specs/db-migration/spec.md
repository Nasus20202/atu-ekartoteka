## ADDED Requirements

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
