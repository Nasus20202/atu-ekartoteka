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

- **GIVEN** any month is hidden because it is empty or beyond the cutoff
- **WHEN** the `Razem` footer row renders
- **THEN** the totals continue to be computed from all 12 monthly columns of the `Payment` record plus the `Bilans otwarcia` values (the hidden rows are still part of the total)

#### Scenario: Year with all zero months still renders header and totals

- **GIVEN** a payment record where every month has zero charge and zero payment
- **WHEN** the table renders
- **THEN** no month rows are rendered
- **AND** the opening balance, `Razem` footer (showing the `Bilans otwarcia` values as its totals), and closing balance rows are still rendered

#### Scenario: Bilans otwarcia row not affected

- **GIVEN** a payment record with non-zero opening balance components but zero values for all twelve months
- **WHEN** the table renders
- **THEN** the `Bilans otwarcia` row is rendered with its actual `openingDebt` and `openingSurplus` values regardless of the empty-month filter

---

### Requirement: Razem Totals Include Opening Balance

The system SHALL compute the `Razem` row of the payment table, in both the web view and the PDF, so that `Wpłaty` is the `Bilans otwarcia` wpłaty value (`openingSurplus`) plus all twelve monthly payments, `Naliczenia` is the `Bilans otwarcia` naliczenia value (`openingDebt`) plus all twelve monthly charges, and `Wpłaty − Naliczenia` equals the `Saldo` shown in that row.

#### Scenario: Wpłaty total includes opening surplus

- **GIVEN** a payment record with `openingSurplus = 80,65` and monthly payments summing to `7270,00`
- **WHEN** the tenant views the payment table
- **THEN** the `Wpłaty` cell of the `Razem` row shows `7350,65 zł`

#### Scenario: Naliczenia total includes opening debt

- **GIVEN** a payment record with `openingDebt = 120,00` and monthly charges summing to `1000,00`
- **WHEN** the tenant views the payment table
- **THEN** the `Naliczenia` cell of the `Razem` row shows `1120,00 zł`

#### Scenario: Razem row adds up to Saldo

- **GIVEN** a payment record whose closing balance equals `openingSurplus − openingDebt + Σ monthly payments − Σ monthly charges`
- **WHEN** the tenant views the payment table
- **THEN** the `Razem` `Wpłaty` value minus the `Razem` `Naliczenia` value equals the `Razem` `Saldo` value

#### Scenario: PDF Razem row uses the same totals

- **GIVEN** a payment record with a non-zero opening debt or surplus
- **WHEN** the tenant downloads the payment PDF
- **THEN** the PDF `Razem` row shows the same `Wpłaty` and `Naliczenia` totals as the web payment table

#### Scenario: PDF summary tiles keep year-only sums

- **GIVEN** a payment record with a non-zero opening debt or surplus
- **WHEN** the tenant downloads the payment PDF
- **THEN** the `Naliczenia` and `Suma wpłat` summary tiles show only the sums of the twelve monthly columns
- **AND** the opening balance is shown in its own `Saldo początkowe` tile

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

---

### Requirement: Share Precision with Trailing Zero Removal

The system SHALL display the ownership share percentage, formatted from the apartment's database share ratio with a decimal comma (Polish locale), rounded to 4 decimal places with trailing zeros stripped and no thousands grouping, in all views.

#### Scenario: Share shown without trailing zeros in apartment card

- **GIVEN** an apartment with `shareNumerator = 57.5` and `shareDenominator = 1000`, so the stored ratio is 0.0575
- **WHEN** the apartment card renders on the tenant dashboard
- **THEN** the share percentage is shown as `5,75%` (rounded to 4 decimals, trailing zeros removed)

#### Scenario: Share shown without trailing zeros in payment details

- **GIVEN** an apartment with a computed share percentage
- **WHEN** the `PaymentApartmentDetailsCard` renders
- **THEN** the "Procent udziału" field shows the percentage rounded to 4 decimals with trailing zeros stripped

#### Scenario: Share shows fallback when no denominator

- **GIVEN** an apartment with `shareDenominator = 0` or `null`, so the stored ratio is unknown
- **WHEN** any view renders the share
- **THEN** no percentage is shown: the view shows its placeholder or omits the share

#### Scenario: Zero share

- **GIVEN** an apartment with `shareNumerator = 0` and `shareDenominator = 1000`
- **WHEN** any view renders the share
- **THEN** the share is shown as `0%`

---

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
- **AND** the visible dashboard viewport shows 12 consecutive months ending with the charge cutoff month by default
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

---

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

---

### Requirement: Dashboard Monthly Balance Chart

The system SHALL display one monthly balance bar chart in the dashboard `Saldo wpłat` card, built from every stored payment year of the tenant's apartments.

#### Scenario: Balance follows payment records

- **GIVEN** an apartment with stored payment years
- **WHEN** the chart data is prepared
- **THEN** each month's balance is the year's opening balance plus cumulative payments minus cumulative charges up to that month
- **AND** months without activity, up to the charge cutoff month, keep the last known balance

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

---

### Requirement: Dashboard Recent Charges Link to Month

The system SHALL make the current and previous month tiles in the dashboard charges card link to the combined charges page with that month opened.

#### Scenario: Month tile opens charges month

- **GIVEN** the charges card shows a tile for a billing period
- **WHEN** the tenant clicks it
- **THEN** they are taken to `/dashboard/charges?month=YYYY-MM`
- **AND** that month is expanded, highlighted and scrolled into view

---

### Requirement: Payment Year Switcher

The system SHALL let a tenant switch between the payment years of an apartment that are inside the tenant history window from its payment detail page.

#### Scenario: Year switcher shown for several years

- **GIVEN** an apartment owned by the tenant with more than one visible payment year
- **WHEN** they view `/dashboard/payments/<apartmentId>/<year>`
- **THEN** the page header shows a `Rok` select listing every visible year newest first, with the current year selected

#### Scenario: Choosing a year navigates

- **GIVEN** the year switcher is visible
- **WHEN** the tenant chooses another year
- **THEN** they are taken to `/dashboard/payments/<apartmentId>/<chosen year>`

#### Scenario: Year switcher hidden for one year

- **GIVEN** an apartment with a single visible payment year
- **WHEN** the tenant views its payment detail page
- **THEN** no year switcher is shown

---

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

---

### Requirement: Quantity Formatting

The system SHALL display charge and notice quantities with a Polish decimal comma and their full stored precision, in tenant views, admin views and PDFs.

#### Scenario: Fractional quantity

- **GIVEN** a notice item with quantity 50.5 and unit `m2`
- **WHEN** it is shown in the `Powiadomienia` card, the admin notifications card, a charge list or a PDF
- **THEN** the quantity reads `50,5 m2`

#### Scenario: Whole quantity

- **GIVEN** a charge item with quantity 1 and unit `szt`
- **WHEN** it is shown
- **THEN** the quantity reads `1 szt`

---

### Requirement: Tenant Charge Cutoff

The system SHALL hide, in tenant views, months whose period is after the current month. The HOA `chargesDataDate` and the contents of payment records SHALL NOT influence which months are visible.

#### Scenario: Future month hidden beyond data date

- **GIVEN** charge records exist for a month after the current month
- **WHEN** the tenant views the charges overview, an apartment's charges page, or any payments list
- **THEN** no month after the current month is listed

#### Scenario: HOA snapshot date no longer filters

- **GIVEN** a HOA with `chargesDataDate` set to 2026-05-31
- **WHEN** the tenant views charges or payments for that HOA
- **THEN** months up to the current month are displayed

#### Scenario: Cutoff capped at the current month

- **GIVEN** today is in October 2026 and charge records exist up to August 2026
- **WHEN** the tenant views any charges or payments list
- **THEN** months with data up to August 2026 are listed and no month after October 2026 appears

#### Scenario: All months shown when data date is null

- **GIVEN** an apartment with no payment records
- **WHEN** the tenant views its charges
- **THEN** all existing charge months up to the current month are shown

#### Scenario: Combined view uses the latest cutoff

- **GIVEN** a tenant with two apartments
- **WHEN** they view the combined charges page
- **THEN** both apartments use the same cutoff, the current month

#### Scenario: Admin views ignore the cutoff

- **GIVEN** an admin viewing an apartment's charges and payments
- **WHEN** the pages render
- **THEN** months after the current month are displayed as before

---

### Requirement: Dashboard Cards Follow the Charge Cutoff

The system SHALL anchor the tenant dashboard on the current month: the current and previous month tiles, the charge trend chart and the balance chart SHALL all end at the current month.

#### Scenario: Dashboard matches charges list

- **GIVEN** today is in October 2026
- **WHEN** a tenant views the dashboard
- **THEN** the `Naliczenia` tiles show October 2026 and September 2026
- **AND** the charge trend and balance charts end with October 2026

#### Scenario: Fallback to the current month

- **GIVEN** a tenant whose apartments have no payment records
- **WHEN** they view the dashboard
- **THEN** the tiles and charts end with the current month

---

### Requirement: Monthly Charges Calculated from Charge Records

The system SHALL calculate the monthly charge of a payment year as the sum of `totalAmount` of the apartment's charge records whose period falls in that month. Every payment table, summary, chart, dashboard tile and PDF SHALL use these calculated values and SHALL NOT use the monthly charge values imported from `wplaty.txt`, which remain stored unchanged. Months after the current month SHALL NOT count toward any total or balance.

#### Scenario: Sum of charge records

- **GIVEN** an apartment with charge records of 100.00 and 50.50 in period 202603 and a payment record for 2026
- **WHEN** the tenant opens the payment page for 2026
- **THEN** March shows a charge of 150.50 regardless of the imported March charge value

#### Scenario: Settlement lines included

- **GIVEN** an apartment with regular charges of 500.00 and a `Wyrównanie zaliczek CW` line of -80.00 in April, and an imported April charge of 500.00
- **WHEN** the payment page renders
- **THEN** April shows a charge of 420.00

#### Scenario: Month without charge records

- **GIVEN** a payment record and no charge records for a month
- **WHEN** the payment page renders
- **THEN** that month's charge is zero

#### Scenario: Future months not counted

- **GIVEN** charge records exist for months after the current month
- **WHEN** the payment page, dashboard or PDF is rendered
- **THEN** those months are not part of any total, closing balance or running balance

#### Scenario: Legacy values kept

- **WHEN** a payment file is imported
- **THEN** the imported monthly charge values are stored in the legacy columns and are not displayed anywhere

---

### Requirement: Balances Derived from Opening Balance

The system SHALL derive the closing balance and the monthly running balance of each payment year as the imported opening balance plus the year's imported payments minus the calculated charges, counting months up to the current month. The imported opening balance SHALL be shown unchanged, and years SHALL NOT be chained: each year starts from its own imported opening balance. The `Razem` row, the summary tiles, the dashboard `Saldo wpłat` card and balance chart, and the admin HOA total closing balance SHALL use the derived closing balance.

#### Scenario: Derived closing balance

- **GIVEN** a payment year with opening balance 100.00, payments summing to 1200.00 and calculated charges summing to 1500.00
- **WHEN** the tenant views the year
- **THEN** the closing balance is -200.00 regardless of the imported closing balance

#### Scenario: Running balance follows calculated charges

- **GIVEN** a payment year with calculated charges and imported payments
- **WHEN** the monthly balance chart is built
- **THEN** each month's balance is the opening balance plus cumulative payments minus cumulative calculated charges up to that month

#### Scenario: Opening balance not recalculated

- **GIVEN** a year whose imported opening balance differs from the previous year's derived closing balance
- **WHEN** the tenant views the year
- **THEN** the year starts from its imported opening balance

#### Scenario: Razem row consistent

- **GIVEN** any payment year
- **WHEN** the payment table renders
- **THEN** the `Razem` `Wpłaty` value minus the `Razem` `Naliczenia` value equals the derived `Saldo`

#### Scenario: Admin HOA total

- **GIVEN** a HOA whose apartments have payment records
- **WHEN** an admin opens the HOA financial summary
- **THEN** the total closing balance is the sum of the derived closing balances of each apartment's latest payment year

---

### Requirement: HOA Header and Footer for Admin

The system SHALL display the HOA header and footer text (parsed from `pow_czynsz.txt`) on the admin HOA apartments page, above the apartment search, in a card that is collapsed by default.

#### Scenario: Collapsed by default

- **GIVEN** a HOA with non-null `header` and `footer`
- **WHEN** an admin opens the apartments page of that HOA
- **THEN** the card is shown collapsed and neither text is visible

#### Scenario: Header and footer shown when expanded

- **GIVEN** the collapsed card of a HOA with `header` and `footer`
- **WHEN** the admin expands it
- **THEN** the header and the footer are shown, each with its label

#### Scenario: Only existing text shown

- **GIVEN** a HOA with a `header` and `footer: null`
- **WHEN** an admin expands the card
- **THEN** only the header is shown

#### Scenario: No card without header and footer

- **GIVEN** a HOA with `header: null` and `footer: null`
- **WHEN** an admin opens its apartments page
- **THEN** no header or footer card is rendered

---

### Requirement: HOA Footer in Dashboard Notifications

The system SHALL display the HOA footer text under the notifications of that HOA in the tenant dashboard notifications card, below the charge items and in the same style as the header.

#### Scenario: Footer shown under the notifications

- **GIVEN** a tenant whose HOA has a non-null `footer`
- **WHEN** they view the dashboard notifications
- **THEN** the footer is shown below that HOA's notification items

#### Scenario: No footer without text

- **GIVEN** a HOA with `footer: null`
- **WHEN** the tenant views the dashboard notifications
- **THEN** no footer is rendered for that HOA

---

### Requirement: Collapsible Dashboard Notifications on Mobile

The system SHALL let the tenant collapse the itemised notifications on narrow screens: below the `lg` breakpoint the per-HOA details are collapsed by default behind a toggle while the total amount due and the PDF download stay visible, and from the `lg` breakpoint up the details are always shown and the toggle is hidden.

#### Scenario: Collapsed on mobile

- **GIVEN** a tenant with notifications on a narrow screen
- **WHEN** they view the dashboard
- **THEN** the total amount and the PDF button are visible and the notification details are hidden behind `Pokaż szczegóły powiadomień`

#### Scenario: Expand and collapse

- **GIVEN** the collapsed details on a narrow screen
- **WHEN** the tenant uses the toggle
- **THEN** the details expand with a smooth transition and the toggle reads `Ukryj szczegóły powiadomień`, and using it again collapses them

#### Scenario: Always open on large screens

- **GIVEN** a large screen
- **WHEN** the tenant views the dashboard
- **THEN** the details are shown and no toggle is displayed

---

### Requirement: Single Charge Month Uses Full Width

The system SHALL show the recent charge months of the dashboard `Naliczenia` card side by side only when both months have charges, and SHALL let a single month use the full width.

#### Scenario: One month with charges

- **GIVEN** only one of the two recent months has charges
- **WHEN** the tenant views the dashboard
- **THEN** that month's tile spans the full width of the card
