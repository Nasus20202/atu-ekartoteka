# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Skip Empty Months in Monthly Listings

The system SHALL hide month rows where both the charge value and the payment value are zero, in all monthly listing views. Yearly totals and balance rows SHALL continue to reflect the full data set (and SHALL NOT be affected by the filtered rendering). Additionally, the system SHALL hide months whose period is after the HOA's `chargesDataDate`.

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

#### Scenario: Future month hidden beyond data date

- **GIVEN** a HOA with `chargesDataDate` set to 2026-05-31
- **WHEN** the tenant views charges or payments for that HOA
- **THEN** months with periods after 202605 (e.g., 202606, 202607) are not displayed in the list

#### Scenario: All months shown when data date is null

- **GIVEN** a HOA with `chargesDataDate = null`
- **WHEN** the tenant views charges or payments
- **THEN** no date-based filtering is applied and all existing months are shown

#### Scenario: Yearly totals reflect full year regardless of hidden rows

- **GIVEN** any month is hidden because it is empty or beyond the data date
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
