## ADDED Requirements

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
- **WHEN** the "Razem" footer row renders
- **THEN** the totals continue to be computed by summing all 12 monthly columns from the `Payment` record (the hidden rows are still part of the total — they simply add zero)

#### Scenario: Year with all zero months still renders header and totals

- **GIVEN** a payment record where every month has zero charge and zero payment
- **WHEN** the table renders
- **THEN** no month rows are rendered
- **AND** the opening balance, "Razem" footer (showing 0,00 zł), and closing balance rows are still rendered

#### Scenario: Bilans otwarcia row not affected

- **GIVEN** a payment record with non-zero opening balance components but zero values for all twelve months
- **WHEN** the table renders
- **THEN** the "Bilans otwarcia" row is rendered with its actual `openingDebt`/`openingSurplus` values regardless of the empty-month filter
