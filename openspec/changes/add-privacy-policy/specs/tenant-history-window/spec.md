# Spec Delta

## MODIFIED Requirements

### Requirement: Settings Stored as One Validated Row

The system SHALL store all application settings in a single database row with one typed column per setting. A setting MAY be unset (null) when its meaning is "not configured". The database SHALL reject a second row and any value outside a setting's allowed range or length, independently of application validation.

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

#### Scenario: Unset text setting

- **GIVEN** a settings row that has never had a privacy policy saved
- **WHEN** the privacy policy setting is read
- **THEN** it is null, not an empty string

#### Scenario: Over-long text rejected by the database

- **WHEN** a write sets the privacy policy to more than 50 000 characters
- **THEN** the database rejects it and the stored value is unchanged

### Requirement: Settings Loaded Once Per Request

The system SHALL read each setting through its own reader that loads only that setting's column, at most once per request however many components need it. Reading one setting SHALL NOT load any other, and a save SHALL read and return only the settings it changes.

#### Scenario: Several consumers in one render

- **GIVEN** a page whose layout and sections each need the history window
- **WHEN** a tenant loads the page
- **THEN** the history window is queried once

#### Scenario: Next request reads fresh values

- **GIVEN** an admin changed the setting
- **WHEN** the next request loads
- **THEN** it reads the stored value, not a value from an earlier request

#### Scenario: Other settings are not loaded

- **GIVEN** a tenant page that needs only the history window
- **WHEN** it renders
- **THEN** the query selects only the history window column and does not load the privacy policy text

#### Scenario: Saving one setting leaves the others untouched

- **GIVEN** a saved privacy policy
- **WHEN** an admin saves a new history window
- **THEN** the save does not read or return the policy text and the stored policy is unchanged

#### Scenario: Missing row yields defaults

- **GIVEN** no settings row exists
- **WHEN** a setting is read
- **THEN** its default is returned: 2 for the history window and null for the privacy policy
