# Capability: HOA Management

## Purpose

Manages Homeowners Association (HOA) entities, which are the top-level organizational units grouping apartments. Admins can list, browse, and rename HOAs.

## Requirements

### Requirement: HOA Listing

The system SHALL allow admins to list all homeowners associations in the system.

#### Scenario: List all HOAs

- **GIVEN** an authenticated admin
- **WHEN** they request the HOA list
- **THEN** all HOA records are returned with their `id`, `externalId`, and `name`

#### Scenario: Admin-only access

- **GIVEN** a non-admin user
- **WHEN** they attempt to access the HOA list endpoint
- **THEN** the request is rejected with 401

---

### Requirement: HOA Creation via Import

The system SHALL automatically create HOA records when new HOA identifiers are encountered during file import.

#### Scenario: Auto-create on import

- **GIVEN** a file import for a HOA identifier not yet in the database
- **WHEN** import processing begins
- **THEN** a new HOA is created with `externalId` set to the identifier and `name` defaulting to the `externalId`

#### Scenario: Existing HOA not duplicated

- **GIVEN** a HOA already in the database
- **WHEN** import runs with the same HOA identifier
- **THEN** the existing HOA record is reused and not duplicated

---

### Requirement: HOA Naming

The system SHALL allow admins to assign a human-readable name to a HOA, overriding the default external ID.

#### Scenario: Update HOA name

- **GIVEN** an authenticated admin and an existing HOA
- **WHEN** they submit a new name for the HOA
- **THEN** the HOA's `name` field is updated while `externalId` remains unchanged

---

### Requirement: HOA-Scoped Apartment Browsing

The system SHALL allow admins to navigate into a specific HOA and browse its apartments.

#### Scenario: Navigate to HOA apartments

- **GIVEN** an authenticated admin on the admin apartments page
- **WHEN** they select a HOA from the list
- **THEN** they are taken to a page scoped to that HOA showing its apartments with search and pagination
