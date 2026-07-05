## MODIFIED Requirements

### Requirement: Skip Empty Months in Monthly Listings

The system SHALL hide month rows where both the charge value and the payment value are zero, in all monthly listing views. Yearly totals and balance rows SHALL continue to reflect the full data set (and SHALL NOT be affected by the filtered rendering). Additionally, the system SHALL hide months whose period is after the HOA's `chargesDataDate`.

#### Scenario: Empty month is hidden in tenant payment table

- **GIVEN** a tenant viewing the payment detail table for a year where January has `januaryCharges = 0` and `januaryPayments = 0`
- **WHEN** the table renders
- **THEN** the January row is not displayed
- **AND** the rows for non-empty months are displayed in their normal calendar order

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
- **THEN** the totals continue to be computed by summing all 12 monthly columns from the `Payment` record (the hidden rows are still part of the total)

#### Scenario: Year with all zero months still renders header and totals

- **GIVEN** a payment record where every month has zero charge and zero payment
- **WHEN** the table renders
- **THEN** no month rows are rendered
- **AND** the opening balance, `Razem` footer (showing `0,00 zł`), and closing balance rows are still rendered

#### Scenario: Bilans otwarcia row not affected

- **GIVEN** a payment record with non-zero opening balance components but zero values for all twelve months
- **WHEN** the table renders
- **THEN** the `Bilans otwarcia` row is rendered with its actual `openingDebt` and `openingSurplus` values regardless of the empty-month filter

## ADDED Requirements

### Requirement: Share Precision with Trailing Zero Removal

The system SHALL display the ownership share percentage rounded to 4 decimal places with trailing zeros stripped in all views.

#### Scenario: Share shown without trailing zeros in apartment card

- **GIVEN** an apartment with `shareNumerator = 57.5` and `shareDenominator = 1000`
- **WHEN** the apartment card renders on the tenant dashboard
- **THEN** the share percentage is shown as `5,75%` (rounded to 4 decimals, trailing zeros removed)

#### Scenario: Share shown without trailing zeros in payment details

- **GIVEN** an apartment with a computed share percentage
- **WHEN** the `PaymentApartmentDetailsCard` renders
- **THEN** the "Procent udziału" field shows the percentage rounded to 4 decimals with trailing zeros stripped

#### Scenario: Share shows fallback when no denominator

- **GIVEN** an apartment with `shareDenominator = 0` or `null`
- **WHEN** any view renders the share
- **THEN** `—` (dash) is shown instead of a percentage
