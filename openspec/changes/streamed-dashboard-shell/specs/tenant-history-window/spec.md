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
