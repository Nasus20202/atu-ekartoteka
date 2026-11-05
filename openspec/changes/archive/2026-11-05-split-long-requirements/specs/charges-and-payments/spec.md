# Spec Delta

## MODIFIED Requirements

### Requirement: Balances Derived from Opening Balance

The system SHALL derive the closing balance and the monthly running balance of each payment year as the imported opening balance plus the year's imported payments minus the calculated charges, counting months up to the current month. The imported opening balance SHALL be shown unchanged, and years SHALL NOT be chained: each year starts from its own imported opening balance.

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

## ADDED Requirements

### Requirement: Derived Closing Balance Used in Every View

The `Razem` row, the summary tiles, the dashboard `Saldo wpłat` card and balance chart, and the admin HOA total closing balance SHALL use the derived closing balance.

#### Scenario: Dashboard and admin total use the derived balance

- **GIVEN** a payment year whose imported closing balance differs from the derived closing balance
- **WHEN** the tenant views the dashboard `Saldo wpłat` card and an admin views the HOA total closing balance
- **THEN** both show the derived closing balance

#### Scenario: Summary tiles use the derived balance

- **GIVEN** a payment year whose imported closing balance differs from the derived closing balance
- **WHEN** the payment summary tiles render
- **THEN** the closing balance tile shows the derived closing balance
