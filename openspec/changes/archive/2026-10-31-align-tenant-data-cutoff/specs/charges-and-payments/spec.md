## MODIFIED Requirements

### Requirement: Skip Empty Months in Monthly Listings

The system SHALL hide month rows where both the charge value and the payment value are zero, in all monthly listing views. Yearly totals and balance rows SHALL continue to reflect the full data set (and SHALL NOT be affected by the filtered rendering). Additionally, the system SHALL hide, in tenant views, months whose period is after the tenant's charge cutoff: the latest month with a non-zero charge in the payment records of the apartment (or of any of the tenant's apartments in combined views), never later than the current month.

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

- **GIVEN** an apartment whose payment records have a non-zero charge up to August 2026 and charge records that also exist for September 2026
- **WHEN** the tenant views the charges overview or the apartment's charges page
- **THEN** no month after August 2026 is listed

#### Scenario: HOA snapshot date no longer filters

- **GIVEN** a HOA with `chargesDataDate` set to 2026-05-31 and payment records with a non-zero charge in August 2026
- **WHEN** the tenant views charges or payments for that HOA
- **THEN** months up to August 2026 are displayed

#### Scenario: Cutoff capped at the current month

- **GIVEN** payment records with a non-zero charge in a month after the current month
- **WHEN** the tenant views any charges or payments list
- **THEN** months after the current month are not displayed

#### Scenario: All months shown when data date is null

- **GIVEN** an apartment with no payment records, whatever its HOA's `chargesDataDate`
- **WHEN** the tenant views its charges
- **THEN** no cutoff filtering is applied and all existing charge months are shown

#### Scenario: Combined view uses the latest cutoff

- **GIVEN** a tenant with two apartments whose latest charged months are July and August 2026
- **WHEN** they view the combined charges page
- **THEN** months up to August 2026 are listed

#### Scenario: Admin views ignore the cutoff

- **GIVEN** an admin viewing an apartment's charges and payments
- **WHEN** the pages render
- **THEN** months after the cutoff are displayed as before

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

## ADDED Requirements

### Requirement: Dashboard Cards Follow the Charge Cutoff

The system SHALL anchor the tenant dashboard on the tenant's charge cutoff instead of today's date: the current and previous month tiles, the charge trend chart and the balance chart SHALL all end at the cutoff month. When no cutoff exists, the current month is used.

#### Scenario: Dashboard matches charges list

- **GIVEN** a tenant whose latest charged month in payments is August 2026 and today is in October 2026
- **WHEN** they view the dashboard
- **THEN** the `Naliczenia` tiles show August 2026 and July 2026
- **AND** the charge trend and balance charts end with August 2026
- **AND** the charges overview page lists August 2026 as its newest month

#### Scenario: Fallback to the current month

- **GIVEN** a tenant whose apartments have no payment records
- **WHEN** they view the dashboard
- **THEN** the tiles and charts end with the current month
