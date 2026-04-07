## ADDED Requirements

### Requirement: Dashboard Payments Summary Per HOA

The system SHALL group payment closing balances per HOA on the tenant dashboard.

#### Scenario: User with apartments in multiple HOAs

- **GIVEN** an approved tenant with apartments in two or more HOAs
- **WHEN** they view the dashboard
- **THEN** the payments summary card shows one row per HOA with the HOA name and the summed closing balance of all apartments in that HOA
- **AND** a grand total is shown below the per-HOA rows

#### Scenario: User with apartments in one HOA

- **GIVEN** an approved tenant with all apartments in a single HOA
- **WHEN** they view the dashboard
- **THEN** the payments summary card shows the HOA name and the total closing balance

#### Scenario: Colour coding per HOA balance

- **GIVEN** a per-HOA balance row
- **WHEN** the balance is negative
- **THEN** the amount is displayed in red
- **WHEN** the balance is zero or positive
- **THEN** the amount is displayed in green

---

### Requirement: Collapsible Year Groups on Payments Pages

The system SHALL render payment year rows as collapsible groups on the payments list page and the admin apartment detail page.

#### Scenario: Payment years collapsed by default

- **GIVEN** a tenant on /dashboard/payments with multiple years of payment data
- **WHEN** the page loads
- **THEN** each year is shown as a collapsed row displaying the year, date range, and closing balance
- **AND** clicking a year row expands it to show the full PaymentYearRow link/details

#### Scenario: Admin payments accordion

- **GIVEN** an admin on /admin/apartments/[hoaId]/[apartmentId]
- **WHEN** the payment list renders
- **THEN** the same collapsible year grouping is applied

---

### Requirement: Pagination on Admin User List

The system SHALL paginate the admin user list.

#### Scenario: User list shows page controls

- **GIVEN** an authenticated admin on the user list page with more than 20 users
- **WHEN** the page loads
- **THEN** pagination controls (previous/next, page number) are shown below the user list

#### Scenario: Page navigation updates displayed users

- **GIVEN** an admin on page 1 of the user list
- **WHEN** they click next page
- **THEN** the next set of users is loaded and displayed

#### Scenario: Filter resets to page 1

- **GIVEN** an admin on page 2 of the user list
- **WHEN** they change the status filter
- **THEN** the page resets to 1

---

### Requirement: HOA Header in Dashboard Apartment List

The system SHALL display the HOA header text above each HOA group of apartments on the dashboard.

#### Scenario: Header shown above apartment group

- **GIVEN** an approved tenant with apartments in an HOA that has a non-null header
- **WHEN** they view the dashboard
- **THEN** the HOA header text is rendered above the apartments belonging to that HOA

#### Scenario: No header shown when HOA header is null

- **GIVEN** an HOA with a null header field
- **WHEN** the tenant views the dashboard
- **THEN** no header text is rendered for that group

#### Scenario: Multiple HOAs grouped with headers

- **GIVEN** a tenant with apartments in multiple HOAs
- **WHEN** they view the dashboard apartment section
- **THEN** apartments are visually grouped per HOA with a separator and HOA name/header

---

### Requirement: Notifications Grouped by HOA

The system SHALL group charge notifications by HOA in the notifications sidebar and on the charges page.

#### Scenario: Sidebar groups notifications by HOA

- **GIVEN** an approved tenant with charge notifications from multiple HOAs
- **WHEN** they view the dashboard
- **THEN** the notifications sidebar shows one section per HOA, each with the HOA header (if set) and the list of notifications belonging to that HOA

#### Scenario: Charges page groups by HOA

- **GIVEN** a tenant on the /dashboard/charges page with charges from multiple apartments in different HOAs
- **WHEN** the page renders
- **THEN** charge notifications are grouped by HOA with the HOA name shown as a section header
