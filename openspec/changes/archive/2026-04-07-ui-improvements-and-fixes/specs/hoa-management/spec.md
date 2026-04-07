## ADDED Requirements

### Requirement: Per-HOA Financial Summary

The system SHALL expose a per-HOA financial summary showing the total closing balance and total charges due across all apartments in that HOA.

#### Scenario: Summary returned for a HOA

- **GIVEN** an authenticated admin and a HOA with payment and charge records
- **WHEN** they request the financial summary for that HOA
- **THEN** the response contains `totalClosingBalance` (sum of each apartment's most recent year closing balance) and `totalChargesDue` (sum of current period charge notifications)

#### Scenario: Summary shown in admin HOA card

- **GIVEN** an authenticated admin on the HOA list page
- **WHEN** the page loads
- **THEN** each HOA card shows the total closing balance and total charges due

#### Scenario: Admin-only access

- **GIVEN** a non-admin user
- **WHEN** they request the HOA financial summary endpoint
- **THEN** the request is rejected with 401

#### Scenario: Empty summary for HOA with no data

- **GIVEN** a HOA with no payment or charge notification records
- **WHEN** the financial summary is requested
- **THEN** both totals are returned as `0`

## MODIFIED Requirements

### Requirement: HOA Listing

The system SHALL allow admins to list all homeowners associations in the system, including their header, footer, and WMB data dates.

#### Scenario: List all HOAs

- **GIVEN** an authenticated admin
- **WHEN** they request the HOA list
- **THEN** all HOA records are returned with their `id`, `externalId`, `name`, `header`, `footer`, `apartmentsDataDate`, `chargesDataDate`, and `notificationsDataDate`

#### Scenario: Admin-only access

- **GIVEN** a non-admin user
- **WHEN** they attempt to access the HOA list endpoint
- **THEN** the request is rejected with 401
