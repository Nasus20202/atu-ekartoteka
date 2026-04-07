## ADDED Requirements

### Requirement: Full Apartment Data in Admin User Cards

The system SHALL display complete apartment details on each user card in the admin user listing.

#### Scenario: User card shows full apartment details

- **GIVEN** an authenticated admin viewing the user list
- **WHEN** a user has one or more assigned apartments
- **THEN** each apartment shows: address, building, number, postal code, city, ownership share (`shareNumerator`/`shareDenominator`), `externalOwnerId`, `externalApartmentId`, and `isActive` status

#### Scenario: Ownership share shown only when present

- **GIVEN** an apartment where `shareNumerator` or `shareDenominator` is null
- **WHEN** the admin views that user's card
- **THEN** the ownership share section is not rendered

#### Scenario: Inactive apartment shown with badge

- **GIVEN** an apartment where `isActive: false`
- **WHEN** the admin views that user's card
- **THEN** the apartment is marked with a "Nieaktywny" badge

---

### Requirement: Inactive Apartment Safeguard in Bulk Creation

The system SHALL visually disable inactive apartments in the bulk account creation picker and require explicit confirmation before including them in a creation batch.

#### Scenario: Inactive apartments rendered as disabled

- **GIVEN** an authenticated admin on the bulk account creation page
- **WHEN** the apartment list loads and includes apartments with `isActive: false`
- **THEN** those apartments are rendered with muted styling and a "Nieaktywny" badge, with the checkbox non-interactive by default

#### Scenario: Confirmation dialog on inactive apartment click

- **GIVEN** an admin clicks on a disabled inactive apartment row
- **WHEN** the click is registered
- **THEN** a confirmation dialog is shown explaining the apartment is not active in the latest import, with "Anuluj" and "Tak, utwórz konto" options

#### Scenario: Confirmed inactive apartment added to selection

- **GIVEN** the confirmation dialog is shown for an inactive apartment
- **WHEN** the admin confirms with "Tak, utwórz konto"
- **THEN** the apartment is added to the selection and treated identically to an active apartment for the remainder of the flow

#### Scenario: Cancelled confirmation leaves apartment unselected

- **GIVEN** the confirmation dialog is shown for an inactive apartment
- **WHEN** the admin cancels with "Anuluj"
- **THEN** the apartment remains unselected

#### Scenario: isActive included in unassigned apartments API response

- **GIVEN** an authenticated admin requesting unassigned apartments
- **WHEN** the API responds
- **THEN** each apartment object includes the `isActive` field
