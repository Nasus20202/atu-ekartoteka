# Spec Delta

## REMOVED Requirements

### Requirement: Dashboard Charge Trend Chart

**Reason**: The dashboard charge trend is now split per apartment instead of per HOA and becomes clickable.

**Migration**: Replaced by "Dashboard Per-Apartment Charge Trend Chart".

### Requirement: Dashboard Payments Summary Per HOA

**Reason**: The dashboard now lists balances per apartment instead of summing them per HOA.

**Migration**: Replaced by "Dashboard Apartment Balances".

## MODIFIED Requirements

### Requirement: Collapsible Period Navigation

The system SHALL present charge periods in a collapsible year/month structure rather than a flat list, with only the newest year expanded and every month collapsed by default unless a month is requested.

#### Scenario: Periods grouped by year

- **GIVEN** an authenticated tenant viewing their charges
- **WHEN** the charges page loads
- **THEN** periods are grouped into collapsible year sections, with each year showing the months within it

#### Scenario: Year section is expandable

- **GIVEN** a tenant on the charges page
- **WHEN** they click a year section header
- **THEN** the months within that year expand or collapse

#### Scenario: Default expansion

- **GIVEN** a tenant opening the per-apartment or the combined charges page without a `month` parameter
- **WHEN** the page loads
- **THEN** only the newest year section is expanded
- **AND** every month within it is collapsed

#### Scenario: Requested month opened

- **GIVEN** a tenant opening the per-apartment or the combined charges page with `?month=YYYY-MM`
- **WHEN** the page loads
- **THEN** the year of that month is expanded and that month is expanded, highlighted and scrolled into view below the sticky header

## ADDED Requirements

### Requirement: Dashboard Per-Apartment Charge Trend Chart

The system SHALL display a compact per-apartment area trend chart on the tenant dashboard using the tenant's existing apartment charge data, with a visible 12-month window that can be shifted through history, and SHALL let the tenant open a month's charges from the chart.

#### Scenario: Dashboard shows recent charge trend

- **GIVEN** an approved tenant with charges in at least two billing periods across their assigned apartments
- **WHEN** they view the dashboard
- **THEN** the charges summary card includes a compact chart of monthly `Naliczenia` totals for the last 12 months
- **AND** the chart splits the totals into separate apartment series
- **AND** each apartment series is rendered as an area-based trend rather than a bar series

#### Scenario: Dashboard trend uses chronological recent periods

- **GIVEN** a tenant with charge data from multiple billing periods
- **WHEN** the dashboard chart data is prepared
- **THEN** the chart includes all available monthly periods in chronological order
- **AND** the visible dashboard viewport shows 12 consecutive months ending with the current month by default
- **AND** those periods are displayed in chronological order from oldest to newest within the chart

#### Scenario: Dashboard trend distinguishes apartments

- **GIVEN** an approved tenant with more than one apartment with charges
- **WHEN** they view the dashboard
- **THEN** the chart renders a separate series for each apartment, in the apartments' order
- **AND** the legend uses the apartment addresses

#### Scenario: Dashboard history can be shifted

- **GIVEN** an approved tenant with more than 12 months of charge history
- **WHEN** they use the dashboard chart history controls
- **THEN** the visible 12-month chart window moves backward or forward through the available history
- **AND** the chart keeps the apartment series split intact while changing the visible month range

#### Scenario: Dashboard falls back when there is not enough history

- **GIVEN** an approved tenant with charges in fewer than two billing periods
- **WHEN** they view the dashboard
- **THEN** the current and previous period summaries remain visible
- **AND** the chart area is replaced by a short explanatory message or omitted rather than rendering a misleading trend plot

#### Scenario: Charge trend month opens charges

- **GIVEN** the dashboard charge trend chart is visible
- **WHEN** the tenant clicks a month on the chart
- **THEN** they are taken to that month's charges, on the apartment's charges page when there is a single apartment series, otherwise on the combined charges page

### Requirement: Dashboard Apartment Balances

The system SHALL show, in the dashboard `Saldo wpłat` card, the latest closing balance of each assigned apartment with payment data, and SHALL link each balance to that apartment's latest payment year.

#### Scenario: One row per apartment

- **GIVEN** an approved tenant with payment data for one or more apartments
- **WHEN** they view the dashboard
- **THEN** the `Saldo wpłat` card shows one row per apartment with its address, HOA name and latest closing balance coloured green when non-negative and red when negative
- **AND** a `Łącznie` total is shown only when there is more than one apartment

#### Scenario: Apartment balance opens payment year

- **GIVEN** the `Saldo wpłat` card lists an apartment
- **WHEN** the tenant clicks its row
- **THEN** they are taken to `/dashboard/payments/<apartmentId>/<latest year>`

### Requirement: Dashboard Monthly Balance Chart

The system SHALL display one monthly balance bar chart in the dashboard `Saldo wpłat` card, built from every stored payment year of the tenant's apartments.

#### Scenario: Balance follows payment records

- **GIVEN** an apartment with stored payment years
- **WHEN** the chart data is prepared
- **THEN** each month's balance is the year's opening balance plus cumulative payments minus cumulative charges up to that month
- **AND** months without activity, up to the current month, keep the last known balance

#### Scenario: Single apartment coloured by sign

- **GIVEN** a tenant with one apartment with payment data
- **WHEN** they view the chart
- **THEN** bars at or above zero are green and bars below zero are red

#### Scenario: Several apartments combined in one chart

- **GIVEN** a tenant with more than one apartment with payment data
- **WHEN** they view the chart
- **THEN** a single chart shows one bar series per apartment, each in its own colour, with a legend of apartment addresses

#### Scenario: Balance history can be shifted

- **GIVEN** more than 12 months of balance history
- **WHEN** the tenant uses the chart history controls
- **THEN** the visible 12-month window moves backward or forward through the history

#### Scenario: Balance bar opens payment year

- **GIVEN** the balance chart is visible
- **WHEN** the tenant clicks a bar
- **THEN** they are taken to the payment year page of that bar's apartment and year

### Requirement: Dashboard Recent Charges Link to Month

The system SHALL make the current and previous month tiles in the dashboard charges card link to the combined charges page with that month opened.

#### Scenario: Month tile opens charges month

- **GIVEN** the charges card shows a tile for a billing period
- **WHEN** the tenant clicks it
- **THEN** they are taken to `/dashboard/charges?month=YYYY-MM`
- **AND** that month is expanded, highlighted and scrolled into view

### Requirement: Payment Year Switcher

The system SHALL let a tenant switch between the stored payment years of an apartment from its payment detail page.

#### Scenario: Year switcher shown for several years

- **GIVEN** an apartment owned by the tenant with more than one stored payment year
- **WHEN** they view `/dashboard/payments/<apartmentId>/<year>`
- **THEN** the page header shows a `Rok` select listing every stored year newest first, with the current year selected

#### Scenario: Choosing a year navigates

- **GIVEN** the year switcher is visible
- **WHEN** the tenant chooses another year
- **THEN** they are taken to `/dashboard/payments/<apartmentId>/<chosen year>`

#### Scenario: Year switcher hidden for one year

- **GIVEN** an apartment with a single stored payment year
- **WHEN** the tenant views its payment detail page
- **THEN** no year switcher is shown
