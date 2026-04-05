## MODIFIED Requirements

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
