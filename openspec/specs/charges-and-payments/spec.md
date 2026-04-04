# Capability: Charges and Payments

## Purpose

Tracks financial obligations (charges) and payment history for each apartment, including itemized charge breakdowns by billing period and year-over-year payment summaries.

## Requirements

### Requirement: Tenant Charge Viewing

The system SHALL allow tenants to view itemized charges for their apartments, grouped by billing period.

#### Scenario: List apartments with charges

- **GIVEN** an authenticated tenant with assigned apartments
- **WHEN** they visit the charges overview page
- **THEN** all their apartments are listed with links to per-apartment charge details

#### Scenario: View charges for a specific apartment

- **GIVEN** an authenticated tenant and an apartment they own
- **WHEN** they navigate to the apartment's charges page
- **THEN** all charge records for that apartment are displayed, grouped or ordered by billing period

#### Scenario: Charge line item display

- **GIVEN** a charge record in the system
- **WHEN** a tenant views it
- **THEN** description, quantity, unit, unit price, total amount, and billing period are shown

#### Scenario: Access control - own apartment only

- **GIVEN** an authenticated tenant
- **WHEN** they attempt to view charges for an apartment not assigned to them
- **THEN** the request is denied

---

### Requirement: Multi-Apartment Charge Period Card

The system SHALL present charge summaries per period across multiple apartments in a unified view.

#### Scenario: Period card for single period

- **GIVEN** a tenant with multiple apartments and charges in a common billing period
- **WHEN** they view the charges dashboard
- **THEN** a summary card shows the combined or per-apartment charge totals for that period

---

### Requirement: Tenant Payment Viewing

The system SHALL allow tenants to view year-by-year payment summaries for their apartments.

#### Scenario: List apartments with payments

- **GIVEN** an authenticated tenant with assigned apartments
- **WHEN** they visit the payments overview page
- **THEN** all their apartments are listed with links to per-apartment payment details

#### Scenario: View payments for a specific apartment

- **GIVEN** an authenticated tenant and an apartment they own
- **WHEN** they navigate to the apartment's payments page
- **THEN** all payment records for that apartment are shown, each representing one calendar year

#### Scenario: Year payment record display

- **GIVEN** a payment record in the system
- **WHEN** a tenant views it
- **THEN** the year, opening balance, closing balance, and monthly payment/charge columns are shown

#### Scenario: Access control - own apartment only

- **GIVEN** an authenticated tenant
- **WHEN** they attempt to view payments for an apartment not assigned to them
- **THEN** the request is denied

---

### Requirement: Charge Notifications

The system SHALL store charge notification records (pre-notification of upcoming charges) separately from confirmed charges.

#### Scenario: Notification data stored on import

- **GIVEN** a charge notification file imported for a HOA
- **WHEN** the import completes
- **THEN** charge notification records are persisted per apartment with description, quantity, unit, unit price, and total amount

#### Scenario: Notification uniqueness

- **GIVEN** an existing charge notification for an apartment and line number
- **WHEN** the same file is imported again (non-clean)
- **THEN** the record is upserted without duplicating data
