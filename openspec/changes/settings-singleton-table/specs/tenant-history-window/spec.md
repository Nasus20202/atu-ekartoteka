# Spec Delta

## ADDED Requirements

### Requirement: Settings Stored as One Validated Row

The system SHALL store all application settings in a single database row with one typed column per setting. The database SHALL reject a second row and any value outside a setting's allowed range, independently of application validation.

#### Scenario: Only one settings row can exist

- **WHEN** a second settings row is inserted
- **THEN** the database rejects it

#### Scenario: Out-of-range value rejected by the database

- **WHEN** a write sets the history window to a value below 0 or above 20
- **THEN** the database rejects it and the stored value is unchanged

#### Scenario: First save creates the row

- **GIVEN** no settings row exists
- **WHEN** an admin saves a valid value
- **THEN** the single settings row is created with that value

### Requirement: Settings Migration Preserves the Stored Value

The migration that introduces the single settings row SHALL work on a database with no stored setting and on one that already has the history window stored, and SHALL leave exactly one settings row either way.

#### Scenario: Existing valid value is kept

- **GIVEN** a database whose old settings table stores a history window of 5
- **WHEN** the migration runs
- **THEN** the settings row holds 5 and the old table is removed

#### Scenario: No stored setting uses the default

- **GIVEN** a database whose old settings table is empty
- **WHEN** the migration runs
- **THEN** the settings row holds the default of 2

#### Scenario: Invalid stored value uses the default

- **GIVEN** an old stored history window that is not a whole number from 0 to 20
- **WHEN** the migration runs
- **THEN** the settings row holds the default of 2 and the migration does not fail

### Requirement: Settings Loaded Once Per Request

The system SHALL read the settings from the database at most once per request, however many tenant views or components need them.

#### Scenario: Several consumers in one render

- **GIVEN** a page whose layout and sections each need the history window
- **WHEN** a tenant loads the page
- **THEN** the settings are queried once

#### Scenario: Next request reads fresh values

- **GIVEN** an admin changed the setting
- **WHEN** the next request loads
- **THEN** it reads the stored value, not a value from an earlier request
