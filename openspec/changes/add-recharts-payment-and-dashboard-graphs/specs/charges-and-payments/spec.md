## ADDED Requirements

### Requirement: Payment Detail Monthly Balance Chart

The system SHALL display an area-based chart on the tenant payment detail page that visualizes the selected payment year's monthly `Wpłaty`, `Naliczenia`, and running `Saldo` using the same underlying payment record shown in the table.

#### Scenario: Monthly area chart shown for payment year

- **GIVEN** an authenticated tenant viewing `/dashboard/payments/[apartmentId]/[year]` for an apartment assigned to them
- **WHEN** the page loads with a payment record for that year
- **THEN** a chart is rendered in the page showing monthly `Wpłaty`, monthly `Naliczenia`, and the running `Saldo`
- **AND** the `Wpłaty` and `Naliczenia` series are rendered as areas rather than bars

#### Scenario: Chart uses the same months as the payment detail table

- **GIVEN** a payment year with one or more non-empty months
- **WHEN** the page renders the chart and the table
- **THEN** the chart's month points reflect the same monthly values used by the payment detail table
- **AND** the running balance for each point is derived from the year's opening balance plus cumulative payments minus cumulative charges

#### Scenario: Chart remains informational and does not replace table data

- **GIVEN** an authenticated tenant on the payment detail page
- **WHEN** the chart is visible
- **THEN** the existing summary tiles, PDF download action, and monthly payment table remain visible on the same page

### Requirement: Dashboard Charge Trend Chart

The system SHALL display a compact HOA-split area trend chart on the tenant dashboard using the tenant's existing apartment charge data, with a visible 12-month window that can be shifted through history.

#### Scenario: Dashboard shows recent charge trend

- **GIVEN** an approved tenant with charges in at least two billing periods across their assigned apartments
- **WHEN** they view the dashboard
- **THEN** the charges summary card includes a compact chart of monthly `Naliczenia` totals for the last 12 months
- **AND** the chart splits the totals into separate HOA series
- **AND** each HOA series is rendered as an area-based trend rather than a bar series

#### Scenario: Dashboard trend uses chronological recent periods

- **GIVEN** a tenant with charge data from multiple billing periods
- **WHEN** the dashboard chart data is prepared
- **THEN** the chart includes all available monthly periods in chronological order
- **AND** the visible dashboard viewport shows 12 consecutive months ending with the current month by default
- **AND** those periods are displayed in chronological order from oldest to newest within the chart

#### Scenario: Dashboard trend distinguishes HOA labels

- **GIVEN** an approved tenant with apartments in more than one HOA
- **WHEN** they view the dashboard
- **THEN** the chart renders a separate series for each HOA represented in the 12-month range
- **AND** the legend uses the HOA names

#### Scenario: Dashboard history can be shifted

- **GIVEN** an approved tenant with more than 12 months of charge history
- **WHEN** they use the dashboard chart history controls
- **THEN** the visible 12-month chart window moves backward or forward through the available history
- **AND** the chart keeps the HOA series split intact while changing the visible month range

#### Scenario: Dashboard falls back when there is not enough history

- **GIVEN** an approved tenant with charges in fewer than two billing periods
- **WHEN** they view the dashboard
- **THEN** the current and previous period summaries remain visible
- **AND** the chart area is replaced by a short explanatory message or omitted rather than rendering a misleading trend plot
