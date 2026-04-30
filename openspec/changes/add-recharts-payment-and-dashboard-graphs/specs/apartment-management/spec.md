## ADDED Requirements

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
