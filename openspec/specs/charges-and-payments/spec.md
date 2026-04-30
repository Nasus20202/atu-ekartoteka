# Capability: Charges and Payments

## Purpose

Tracks financial obligations (charges) and payment history for each apartment, including itemized charge breakdowns by billing period and year-over-year payment summaries.

## Requirements

### Requirement: Tenant Charge Viewing

The system SHALL allow tenants to view itemized charges for their apartments, grouped by billing period. The per-apartment charge detail page SHALL include a "Drukuj / Pobierz PDF" button that allows the tenant to download a PDF of all displayed charges.

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

#### Scenario: PDF download button visible on charge detail

- **GIVEN** an authenticated tenant viewing their apartment's charge detail page
- **WHEN** the page loads
- **THEN** a "Drukuj / Pobierz PDF" button is visible on the page

---

### Requirement: Multi-Apartment Charge Period Card

The system SHALL present charge summaries per period across multiple apartments in a unified view.

#### Scenario: Period card for single period

- **GIVEN** a tenant with multiple apartments and charges in a common billing period
- **WHEN** they view the charges dashboard
- **THEN** a summary card shows the combined or per-apartment charge totals for that period

---

### Requirement: Tenant Payment Viewing

The system SHALL allow tenants to view year-by-year payment summaries for their apartments. The per-apartment payment detail page SHALL include a "Drukuj / Pobierz PDF" button that allows the tenant to download a PDF of the displayed payment year.

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

#### Scenario: PDF download button visible on payment detail

- **GIVEN** an authenticated tenant viewing their apartment's payment detail page for a specific year
- **WHEN** the page loads
- **THEN** a "Drukuj / Pobierz PDF" button is visible on the page

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

---

### Requirement: Collapsible Period Navigation

The system SHALL present charge periods in a collapsible year/month structure rather than a flat list.

#### Scenario: Periods grouped by year

- **GIVEN** an authenticated tenant viewing their charges
- **WHEN** the charges page loads
- **THEN** periods are grouped into collapsible year sections, with each year showing the months within it

#### Scenario: Year section is expandable

- **GIVEN** a tenant on the charges page
- **WHEN** they click a year section header
- **THEN** the months within that year expand or collapse

---

### Requirement: Opening Balance Colour Coding

The system SHALL display the opening balance (`Saldo początkowe`) in a colour that reflects whether it is negative or non-negative.

#### Scenario: Negative opening balance shown in red

- **GIVEN** a payment record with a negative `openingBalance`
- **WHEN** the tenant views the payment detail page
- **THEN** the opening balance value is displayed in red

#### Scenario: Non-negative opening balance shown in green

- **GIVEN** a payment record with an opening balance ≥ 0
- **WHEN** the tenant views the payment detail page
- **THEN** the opening balance value is displayed in green

---

### Requirement: Bilans Otwarcia Real Values

The system SHALL display the actual opening debt and opening surplus values in the "Bilans otwarcia" row of the payment table, not a placeholder.

#### Scenario: Bilans otwarcia shows opening surplus as wpłaty

- **GIVEN** a payment record with `openingSurplus > 0`
- **WHEN** the tenant views the payment table
- **THEN** the Wpłaty column of the Bilans otwarcia row shows the `openingSurplus` value

#### Scenario: Bilans otwarcia shows opening debt as naliczenia

- **GIVEN** a payment record with `openingDebt > 0`
- **WHEN** the tenant views the payment table
- **THEN** the Naliczenia column of the Bilans otwarcia row shows the `openingDebt` value

#### Scenario: Opening debt and surplus stored on import

- **GIVEN** a WPLATY file parsed during import
- **WHEN** the import completes
- **THEN** `openingDebt` (field 6) and `openingSurplus` (field 7) are stored on the `Payment` record

---

### Requirement: Wpłaty to Naliczenia Navigation Link

The system SHALL provide a direct navigation link from each month's charge entry in the payments detail view to the corresponding naliczenia for that month.

#### Scenario: Month row links to naliczenia

- **GIVEN** an authenticated tenant viewing the payment detail table for a specific year
- **WHEN** the table renders a month row that has a charge value
- **THEN** the Naliczenia cell contains a link to the charges page filtered to that month

---

### Requirement: HOA Header in Charge Notifications

The system SHALL display the HOA header text (parsed from `pow_czynsz.txt`) above charge notification lists.

#### Scenario: Header shown in notifications sidebar

- **GIVEN** a HOA with a non-null `header` value
- **WHEN** a tenant views the charge notifications sidebar
- **THEN** the HOA header text is displayed above the notification items

#### Scenario: Header shown in charge notifications card

- **GIVEN** a HOA with a non-null `header` value
- **WHEN** a tenant views the charge notifications card
- **THEN** the HOA header text is displayed above the notification items

#### Scenario: No header shown when null

- **GIVEN** a HOA with `header: null`
- **WHEN** a tenant views any charge notification view
- **THEN** no header section is rendered

---

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

---

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

---

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

---

### Requirement: Decimal Precision for Money Display and Aggregation

The system SHALL represent all monetary fields on `Charge` and `Payment` records as `Decimal(14, 4)` precision throughout the API, business logic, and UI rendering layers, formatting to 2 decimal places only at the leaf rendering step via `formatCurrency`.

#### Scenario: Aggregations preserve precision

- **GIVEN** an apartment with twelve monthly charge values that include sub-grosz fractions
- **WHEN** the yearly total is computed for display
- **THEN** the sum is computed using `Decimal` addition (not native float `+`) and the displayed total matches the file-provided sums exactly when rounded to 2 decimals

#### Scenario: API responses serialise money as decimal strings

- **GIVEN** a client requesting charge or payment data via the API
- **WHEN** the API serialises the response
- **THEN** monetary fields appear as decimal strings (e.g. `"142.1000"`) preserving the stored precision

#### Scenario: Display formatter accepts Decimal, string, or number

- **GIVEN** a UI component receiving a monetary value as `Prisma.Decimal`, a numeric string, or a number
- **WHEN** the component renders the value via `formatCurrency`
- **THEN** the helper accepts all three forms and produces the same `pl-PL` PLN-formatted output (e.g. `"142,10 zł"`) without precision loss

---

### Requirement: Skip Empty Months in Monthly Listings

The system SHALL hide month rows where both the charge value and the payment value are zero, in all monthly listing views. Yearly totals and balance rows SHALL continue to reflect the full data set (and SHALL NOT be affected by the filtered rendering).

#### Scenario: Empty month is hidden in tenant payment table

- **GIVEN** a tenant viewing the payment detail table for a year where January has `januaryCharges = 0` and `januaryPayments = 0`
- **WHEN** the table renders
- **THEN** the January row is not displayed
- **AND** the rows for non-empty months are displayed in their normal calendar order

#### Scenario: Empty month is hidden in dashboard payments card

- **GIVEN** a tenant viewing the dashboard payments card for a year that has any zero-charge-and-zero-payment months
- **WHEN** the card renders the per-month list
- **THEN** the empty months are omitted from the list

#### Scenario: Empty month is hidden in admin payments view

- **GIVEN** an admin viewing the per-apartment payments accordion
- **WHEN** the embedded payment table renders
- **THEN** months that are empty for both columns are hidden, identical to the tenant view

#### Scenario: Yearly totals reflect full year regardless of hidden rows

- **GIVEN** any month is hidden because it is empty
- **WHEN** the `Razem` footer row renders
- **THEN** the totals continue to be computed by summing all 12 monthly columns from the `Payment` record (the hidden rows are still part of the total and simply add zero)

#### Scenario: Year with all zero months still renders header and totals

- **GIVEN** a payment record where every month has zero charge and zero payment
- **WHEN** the table renders
- **THEN** no month rows are rendered
- **AND** the opening balance, `Razem` footer (showing `0,00 zł`), and closing balance rows are still rendered

#### Scenario: Bilans otwarcia row not affected

- **GIVEN** a payment record with non-zero opening balance components but zero values for all twelve months
- **WHEN** the table renders
- **THEN** the `Bilans otwarcia` row is rendered with its actual `openingDebt` and `openingSurplus` values regardless of the empty-month filter

---

### Requirement: Explicit DTO Contracts for Charge and Payment Rendering

The system SHALL use explicit DTO contracts for charge and payment data passed from server-side page composition into client-side rendering and download components.

#### Scenario: Payments page maps to DTO before client rendering

- **WHEN** the tenant payments overview page renders a yearly payment row
- **THEN** the row component receives a named payment DTO contract rather than a database entity or serializer-defined alias

#### Scenario: Payment detail page maps download data to DTO

- **WHEN** the tenant payment detail page renders the PDF download action
- **THEN** the download button receives a named payment DTO contract
- **AND** the page continues to render the existing payment summary and table without changing user-visible behaviour

#### Scenario: Charges pages map to DTO before client rendering

- **WHEN** a tenant charges page renders grouped charge data
- **THEN** the charge cards and download actions receive named charge DTO contracts rather than serializer-defined aliases

#### Scenario: DTO migration does not change displayed content

- **WHEN** charge and payment DTOs replace the previous serializer outputs
- **THEN** the rendered values, labels, grouping, and PDF download availability remain unchanged for tenants and admins
