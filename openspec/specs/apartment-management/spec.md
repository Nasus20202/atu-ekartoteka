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

#### Scenario: Sorted results use natural order

- **GIVEN** any apartment listing request
- **WHEN** apartments are returned
- **THEN** they are sorted by building ascending using natural (numeric-aware) sort, then by apartment number ascending using natural sort — so `"10"` sorts after `"9"`, not before it

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
- **THEN** the apartments where `userId IS NULL` and `email IS NOT NULL` are returned, grouped by HOA, sorted by HOA name, then building, then apartment number

#### Scenario: Paginated by HOA

- **GIVEN** more HOAs with unassigned apartments than fit on one page
- **WHEN** the admin calls the endpoint with `page` and `limit` (default 10 HOAs per page, at most 100)
- **THEN** only that page of HOAs is returned, each with all of its unassigned apartments, together with `pagination` (`page`, `limit`, `total` HOAs, `totalPages`)
- **AND** apartments sharing an address or an owner email are never split across pages

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

---

### Requirement: Admin Apartment Monthly Finance Charts

The system SHALL display a monthly area-based finance chart for each stored payment year on the admin apartment detail page using the same payment data shown in that year's detailed section.

#### Scenario: Monthly chart shown for each payment year

- **GIVEN** an authenticated admin viewing `/admin/apartments/[hoaId]/[apartmentId]` for an apartment that has payment history
- **WHEN** the apartment detail data loads successfully
- **THEN** each displayed payment year section includes a chart showing monthly `Wpłaty`, monthly `Naliczenia`, and running `Saldo` for that year
- **AND** the monthly `Wpłaty` and `Naliczenia` series are rendered as areas rather than bars

#### Scenario: Monthly chart uses the same year data as the table

- **GIVEN** an admin viewing a payment year section with one or more non-empty months
- **WHEN** the section renders its chart and monthly table
- **THEN** both the chart and the table are derived from the same stored payment year record
- **AND** the chart's running balance uses the year's opening balance plus cumulative payments minus cumulative charges

#### Scenario: Existing payment history UI remains available

- **GIVEN** an authenticated admin on the apartment detail page
- **WHEN** the monthly payment charts are rendered
- **THEN** the existing yearly payment sections and PDF download actions remain available below the chart

#### Scenario: Empty monthly chart falls back when year has no monthly activity

- **GIVEN** a payment year whose monthly values are all zero
- **WHEN** the admin opens that year section
- **THEN** the payment history section remains visible
- **AND** the chart is omitted or replaced by a short informational message indicating that there is no monthly activity to plot

### Requirement: HOA Apartment List Infinite Scroll

The admin HOA apartments page (`/admin/apartments/[hoaId]`) SHALL load apartments with infinite scrolling as defined by the infinite scrolling requirements in `visual-design`, in natural building/number order. The `search` and `activeOnly` URL parameters SHALL drive the list; a `page` URL parameter SHALL be ignored and never written.

#### Scenario: Scrolling loads further apartments

- **GIVEN** a HOA with 70 apartments and a page size of 20
- **WHEN** the admin opens the HOA apartments page and scrolls to the end three times
- **THEN** all 70 apartments are shown in one list in natural building/number order with no duplicates
- **AND** the `Znaleziono 70 mieszkań` count is shown from the first load

#### Scenario: Search restarts the list

- **GIVEN** the admin has scrolled through several pages
- **WHEN** they submit a search or toggle `Tylko aktywne`
- **THEN** the URL `search`/`activeOnly` parameters are updated and the list restarts from the first matching apartments

#### Scenario: Legacy page parameter ignored

- **GIVEN** a bookmarked URL `/admin/apartments/<hoaId>?page=3`
- **WHEN** the admin opens it
- **THEN** the list starts from the first apartment

#### Scenario: Duplicate active address highlighted across loaded pages

- **GIVEN** two active apartments with the same address, building and number that fall on different API pages
- **WHEN** both have been loaded by scrolling
- **THEN** both cards are marked as duplicates

### Requirement: Compact Apartment Table

In the table view of the HOA apartments page, apartments SHALL be shown as table rows under the headers `Adres`, `Właściciel`, `Udział` and `Status`. Each row SHALL show the label, owner, share percentage (or `-` when unknown) and status, with the same inactive and duplicate markers as the cards. Activating the address link SHALL open the apartment details page; the row SHALL NOT show external IDs or postal code/city.

#### Scenario: Table content

- **GIVEN** the table view on a HOA's apartments
- **WHEN** an active apartment `ul. Przytulna 22 A/4` owned by `Ślesiccy Teresa i Jerzy D` with share 1.22% is shown
- **THEN** its row shows `ul. Przytulna 22 A/4`, `Ślesiccy Teresa i Jerzy D`, `1.22%` and `Aktywne` under the matching headers

#### Scenario: Row opens details

- **GIVEN** the table view
- **WHEN** the admin clicks the address of an apartment
- **THEN** the apartment details page opens

#### Scenario: Inactive and duplicate markers

- **GIVEN** an inactive apartment and two active apartments sharing an address are loaded
- **WHEN** the table view is shown
- **THEN** the inactive row is muted with `Nieaktywne` and both duplicate rows show `Duplikat adresu`

#### Scenario: Narrow screens

- **GIVEN** a 390 px wide screen
- **WHEN** the table view is shown
- **THEN** the table scrolls inside its own container and the page does not scroll horizontally

#### Scenario: Infinite scrolling appends table rows

- **GIVEN** the table view is selected and more apartments remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows

### Requirement: Apartment Table Sorting

The apartment table SHALL sort by `Adres`, `Właściciel`, `Udział` and `Status` from the column headers, with the sort column and direction sent to the apartments API so every page arrives in that order. Address and owner SHALL use locale-aware alphanumeric order, share SHALL sort numerically by numerator, then denominator (not by the formatted string), which is ratio order for an HOA using one denominator, and apartments with an unknown share SHALL come last when sorting ascending. Status SHALL group active apartments before inactive ones when sorting ascending.

#### Scenario: Sort by address

- **GIVEN** apartments `ul. Przewijana 1/2` and `ul. Przewijana 1/10`
- **WHEN** the admin sorts by `Adres` ascending
- **THEN** `ul. Przewijana 1/2` comes before `ul. Przewijana 1/10`

#### Scenario: Sort by share value

- **GIVEN** apartments with shares 20% and 1.22%
- **WHEN** the admin sorts by `Udział` ascending
- **THEN** the 1.22% apartment comes first

#### Scenario: Unknown share

- **GIVEN** an apartment without a share and apartments with shares
- **WHEN** the admin sorts by `Udział` ascending
- **THEN** the apartment without a share is last

#### Scenario: Status order

- **GIVEN** active and inactive apartments
- **WHEN** the admin sorts by `Status` ascending
- **THEN** active apartments are listed before inactive ones
