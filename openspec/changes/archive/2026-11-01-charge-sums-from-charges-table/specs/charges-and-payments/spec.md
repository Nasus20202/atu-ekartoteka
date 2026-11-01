## ADDED Requirements

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

### Requirement: Single Charge Month Uses Full Width

The system SHALL show the recent charge months of the dashboard `Naliczenia` card side by side only when both months have charges, and SHALL let a single month use the full width.

#### Scenario: One month with charges

- **GIVEN** only one of the two recent months has charges
- **WHEN** the tenant views the dashboard
- **THEN** that month's tile spans the full width of the card

## MODIFIED Requirements

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
