# Spec Delta

## MODIFIED Requirements

### Requirement: Collapsible Year Groups on Payments Pages

The system SHALL render payment year rows as collapsible groups on the payments list page and the admin apartment detail page. On the admin apartment detail page the newest stored year SHALL start expanded and every older year SHALL start collapsed.

#### Scenario: Payment years collapsed by default

- **GIVEN** a tenant on /dashboard/payments with multiple years of payment data
- **WHEN** the page loads
- **THEN** each year is shown as a collapsed row displaying the year, date range, and closing balance
- **AND** clicking a year row expands it to show the full PaymentYearRow link/details

#### Scenario: Admin payments accordion

- **GIVEN** an admin on /admin/apartments/[hoaId]/[apartmentId]
- **WHEN** the payment list renders
- **THEN** the same collapsible year grouping is applied

#### Scenario: Admin newest payment year open

- **GIVEN** an apartment with payment years 2024, 2025 and 2026 and the current date in 2027
- **WHEN** an admin opens the apartment detail page
- **THEN** the 2026 section is expanded and the 2025 and 2024 sections are collapsed

## ADDED Requirements

### Requirement: Admin Charge History Grouped by Year

The system SHALL group the admin apartment detail charge list into collapsible year sections, newest first, each containing that year's collapsible month sections. The newest year SHALL start expanded with its months collapsed, and every older year SHALL start collapsed.

#### Scenario: Admin charges grouped by year

- **GIVEN** an apartment with charges in 2025 and 2026
- **WHEN** an admin opens the apartment detail page
- **THEN** the `Naliczenia` card shows a `2026` section followed by a `2025` section

#### Scenario: Admin default expansion

- **GIVEN** the admin charge list with several years
- **WHEN** it first renders
- **THEN** only the newest year is expanded, all of its months are collapsed, and older years are collapsed

#### Scenario: Admin expands an older year

- **GIVEN** a collapsed older year section
- **WHEN** the admin clicks its header
- **THEN** that year's months are listed and each month can be expanded to show its line items and PDF button
