# Spec Delta

## ADDED Requirements

### Requirement: Owner Validity Dates Import

The system SHALL read the start date and the end date of each apartment row in a `lok` file and store them on the apartment as `validFrom` and `validTo`. Both dates are optional. A blank or non-`YYYYMMDD` value SHALL be stored as null without failing the row. Dates SHALL be updated on reimport when they change.

#### Scenario: Start and end dates stored

- **GIVEN** a `lok` row with a start date `20250210` and an end date `20250209` for a former owner
- **WHEN** import runs
- **THEN** the apartment row stores `validFrom` as 2025-02-10 and `validTo` as 2025-02-09

#### Scenario: Current owner has no end date

- **GIVEN** a `lok` row with a start date and an empty end date
- **WHEN** import runs
- **THEN** the apartment row stores `validFrom` and `validTo` is null

#### Scenario: Invalid date stored as null

- **GIVEN** a `lok` row whose start date is not an 8-digit date
- **WHEN** import runs
- **THEN** `validFrom` is null and the row is imported

#### Scenario: Extra hash in owner name

- **GIVEN** a `lok` row whose owner name contains an extra `#`, so the row has 15 fields
- **WHEN** import runs
- **THEN** the start date and end date are read from the fields that follow the shifted owner name, not from the fields of a 14-field row

### Requirement: Former Owner Deactivation

The system SHALL mark an apartment row as inactive when its `validTo` date is on or before the date of the import. A row whose `validTo` is null or later than the import date SHALL remain active. A former owner that is still listed in the file SHALL NOT be counted as the current owner.

#### Scenario: Owner change within one file

- **GIVEN** a `lok` file lists a former owner with `validTo` `20250209` and the new owner of the same apartment with `validFrom` `20250210` and no end date
- **WHEN** import runs on or after 2025-02-10
- **THEN** the former owner's row is set to `isActive: false`
- **AND** the new owner's row stays `isActive: true`

#### Scenario: End date in the future

- **GIVEN** a `lok` row with `validTo` later than the import date
- **WHEN** import runs
- **THEN** the row stays `isActive: true`

#### Scenario: Owner change not yet reflected in file

- **GIVEN** a row that was active and whose `validTo` is on or before the import date
- **WHEN** the import runs with the updated file
- **THEN** the row is set to `isActive: false` and counted as updated in the import statistics
