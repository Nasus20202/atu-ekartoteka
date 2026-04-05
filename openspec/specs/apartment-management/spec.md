# Capability: Apartment Management

## Purpose

Manages the inventory of apartments within homeowners associations, including admin browsing, search, assignment to tenants, and tenant-facing views of their own apartments.

## Requirements

### Requirement: Admin Apartment Listing

The system SHALL allow admins to list apartments with filtering, search, and pagination.

#### Scenario: List apartments for a HOA

- **GIVEN** an authenticated admin
- **WHEN** they request apartments with a `hoaId` query parameter
- **THEN** apartments belonging to that HOA are returned with pagination metadata and HOA details

#### Scenario: Paginated listing

- **GIVEN** an authenticated admin
- **WHEN** they request apartments with `page` and `limit` parameters
- **THEN** the correct slice of results is returned along with total count and page count

#### Scenario: Filter by active status

- **GIVEN** an authenticated admin
- **WHEN** they request apartments with `activeOnly=true`
- **THEN** only apartments where `isActive: true` are included

#### Scenario: Search by apartment number or owner

- **GIVEN** an authenticated admin
- **WHEN** they provide a plain `search` query (no slash)
- **THEN** apartments matching by number, owner, address, building, city, external owner ID, or external apartment ID are returned (case-insensitive)

#### Scenario: Search by building/number with slash notation

- **GIVEN** an authenticated admin
- **WHEN** they provide a search query like `17/12`
- **THEN** only apartments matching building `17` AND number `12` are returned

#### Scenario: Sorted results

- **GIVEN** any apartment listing request
- **WHEN** apartments are returned
- **THEN** they are sorted by building ascending, then by apartment number ascending (numerically if both are integers, otherwise lexically)

---

### Requirement: Admin Apartment Detail and Assignment

The system SHALL allow admins to view a specific apartment's details and assign or unassign it to a tenant user. The admin apartment detail page SHALL include PDF download buttons: one in the "Naliczenia" card to download all charges for that apartment, and one per payment year in the "Historia wpłat" card to download the payment record for that year.

#### Scenario: View apartment details

- **GIVEN** an authenticated admin
- **WHEN** they fetch a specific apartment by ID
- **THEN** the apartment's full details including owner data and HOA info are returned

#### Scenario: Assign apartment to user

- **GIVEN** an authenticated admin and an unassigned apartment
- **WHEN** the admin updates the apartment with a `userId`
- **THEN** the apartment is linked to that user

#### Scenario: Unassign apartment

- **GIVEN** an authenticated admin and an apartment currently assigned to a user
- **WHEN** the admin sets `userId` to null
- **THEN** the apartment's user assignment is cleared

#### Scenario: PDF download button in Naliczenia card

- **GIVEN** an authenticated admin viewing the apartment detail page
- **WHEN** the page loads and the apartment has charge records
- **THEN** a "Drukuj / Pobierz PDF" button is visible in the Naliczenia card

#### Scenario: PDF download button per payment year in Historia wpłat

- **GIVEN** an authenticated admin viewing the apartment detail page
- **WHEN** the page loads and the apartment has payment records
- **THEN** each payment year section in the Historia wpłat card contains its own "Drukuj / Pobierz PDF" button

---

### Requirement: Tenant Apartment Dashboard

The system SHALL present tenants with a summary of their assigned apartments and allow them to navigate to charges and payments per apartment.

#### Scenario: Dashboard with assigned apartments

- **GIVEN** an authenticated tenant with one or more apartments assigned
- **WHEN** they visit the dashboard
- **THEN** each apartment is shown with its address, building, number, and links to its charges and payments

#### Scenario: Dashboard with no apartments

- **GIVEN** an authenticated tenant with no assigned apartments
- **WHEN** they visit the dashboard
- **THEN** a message indicating no apartments are assigned is displayed and navigation buttons are hidden

---

### Requirement: Unassigned Apartments for Bulk User Creation

The system SHALL expose an admin endpoint listing apartments that have no linked user account but do have an email address, enabling admins to create accounts in bulk.

#### Scenario: List unassigned apartments grouped by HOA

- **GIVEN** an authenticated admin
- **WHEN** they call `GET /api/admin/unassigned-apartments`
- **THEN** all apartments where `userId IS NULL` and `email IS NOT NULL` are returned, grouped by HOA, sorted by HOA name, then building, then apartment number

#### Scenario: Empty result

- **GIVEN** every apartment either has an assigned user or no email
- **WHEN** the admin calls the endpoint
- **THEN** an empty `hoas` array is returned

#### Scenario: Unauthorized access

- **GIVEN** a non-admin user
- **WHEN** they call the endpoint
- **THEN** the request is rejected with 401

---

### Requirement: Apartment Ownership Share

The system SHALL store and display the ownership share (numerator/denominator) of each apartment within its HOA.

#### Scenario: Share stored on import

- **GIVEN** apartment data imported from a legacy file
- **WHEN** the file contains share numerator and denominator values
- **THEN** these values are persisted on the apartment record

#### Scenario: Inactive apartments remain visible

- **GIVEN** an apartment that was present in a previous import but not in the latest file
- **WHEN** an admin lists apartments without `activeOnly=true`
- **THEN** the apartment appears in results with `isActive: false`
