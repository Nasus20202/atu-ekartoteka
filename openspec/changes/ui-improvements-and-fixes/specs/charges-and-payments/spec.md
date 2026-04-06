## ADDED Requirements

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
