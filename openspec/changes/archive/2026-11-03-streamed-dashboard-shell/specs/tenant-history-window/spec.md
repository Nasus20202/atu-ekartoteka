## ADDED Requirements

### Requirement: Application Settings Cache

The system SHALL cache the global application settings in memory for a bounded
time so that reading them does not query the database on every request. A save
SHALL make the new value visible immediately to the replica that handled it,
and to every other replica no later than the cache lifetime. The admin settings
endpoint SHALL always return stored values, not cached ones.

#### Scenario: Repeated reads

- **WHEN** settings are read several times within the cache lifetime
- **THEN** the database is queried once

#### Scenario: Save invalidates

- **GIVEN** the cache holds the previous value
- **WHEN** an admin saves a different history window
- **THEN** the next read on that replica returns the new value

#### Scenario: Unchanged save

- **WHEN** an admin saves values equal to the stored ones
- **THEN** nothing is written and the cache is not invalidated

## MODIFIED Requirements

### Requirement: Admin-Configurable Window Length

The system SHALL let an admin set, on the `Ustawienia` page at `/admin/settings`, the number of previous full calendar years visible to tenants. The value SHALL be a whole number from 0 to 20 and SHALL default to 2 when it has never been set. The page SHALL load the stored value, never a cached one, and saving SHALL go through an admin-only Server Action.

#### Scenario: Admin views the current setting

- **GIVEN** an authenticated admin
- **WHEN** they open `/admin/settings`
- **THEN** a select labelled `Liczba poprzednich lat widocznych dla mieszkańców` shows the current value (e.g. `2 lata`), offering every whole number from 0 to 20
- **AND** a hint explains which years tenants currently see (e.g. `Mieszkańcy widzą lata 2025–2027`)

#### Scenario: Admin saves a new value

- **GIVEN** an admin on the settings page
- **WHEN** they choose `1 rok` and click `Zapisz`
- **THEN** the value is stored, a success alert `Zapisano ustawienia` is shown
- **AND** subsequent tenant page loads use the new window

#### Scenario: Invalid value rejected

- **GIVEN** an authenticated admin
- **WHEN** the save action receives a value that is negative, above 20 or not a whole number, or an unknown setting
- **THEN** it returns an invalid result and nothing is stored

#### Scenario: Malformed request body rejected

- **GIVEN** an authenticated admin
- **WHEN** the save action receives input that is not an object of settings
- **THEN** it returns an invalid result and nothing is stored

#### Scenario: Default when never configured

- **GIVEN** no stored setting
- **WHEN** a tenant page or the settings page loads
- **THEN** the value 2 is used

#### Scenario: Non-admin cannot change setting

- **GIVEN** an unauthenticated user or a tenant
- **WHEN** they invoke the save action
- **THEN** it returns an unauthenticated or forbidden result and nothing is stored

#### Scenario: Settings in admin navigation

- **GIVEN** an authenticated admin in the admin panel
- **WHEN** the navigation renders
- **THEN** it contains an `Ustawienia` link to `/admin/settings`
