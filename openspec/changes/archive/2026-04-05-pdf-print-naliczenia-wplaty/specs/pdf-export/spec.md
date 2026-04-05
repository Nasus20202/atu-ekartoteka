## ADDED Requirements

### Requirement: Charge PDF Export

The system SHALL allow a tenant to download a PDF of the itemized charges for a specific apartment. The PDF SHALL include a header with the apartment address and HOA name, all charge line items grouped by billing period, and each line item's description, quantity, unit, unit price, and total amount. The PDF SHALL be generated entirely in the browser and downloaded without a server round-trip.

#### Scenario: Download charges PDF as tenant

- **WHEN** a tenant clicks "Drukuj / Pobierz PDF" on the per-apartment charge detail page
- **THEN** a PDF file is downloaded to the tenant's device containing all charges for that apartment

#### Scenario: PDF content matches on-screen data

- **WHEN** a PDF is generated for an apartment's charges
- **THEN** the PDF contains the same billing periods, line items, descriptions, quantities, units, unit prices, and totals as shown on the page

#### Scenario: Polish characters render correctly

- **WHEN** a PDF is generated containing Polish diacritics (e.g., ą, ę, ś, ó, ł, ż, ź)
- **THEN** all characters are legible and not rendered as placeholder boxes

#### Scenario: Download filename for charges

- **WHEN** a charges PDF is downloaded
- **THEN** the filename follows the pattern `naliczenia-{apartmentAddress}-{date}.pdf`

### Requirement: Payment PDF Export

The system SHALL allow a tenant to download a PDF of the payment history for a specific apartment and year. The PDF SHALL include a header with the apartment address and year, an opening balance, a monthly table (month, wpłaty, naliczenia, saldo), and the closing balance. The PDF SHALL be generated entirely in the browser and downloaded without a server round-trip.

#### Scenario: Download payments PDF as tenant

- **WHEN** a tenant clicks "Drukuj / Pobierz PDF" on the per-apartment payment detail page
- **THEN** a PDF file is downloaded to the tenant's device containing the payment history for that apartment and year

#### Scenario: PDF content matches on-screen data

- **WHEN** a PDF is generated for an apartment's payment year
- **THEN** the PDF contains the same opening balance, monthly payments/charges, running balance, and closing balance as shown on the page

#### Scenario: Polish characters render correctly in payments PDF

- **WHEN** a payments PDF is generated containing Polish diacritics
- **THEN** all characters are legible and not rendered as placeholder boxes

#### Scenario: Download filename for payments

- **WHEN** a payments PDF is downloaded
- **THEN** the filename follows the pattern `wplaty-{apartmentAddress}-{year}.pdf`

### Requirement: Admin Charge PDF Export

The system SHALL allow an admin to download a PDF of the itemized charges for any apartment directly from the admin apartment detail page. The "Drukuj / Pobierz PDF" button SHALL appear in the "Naliczenia" card. The PDF content and format SHALL match the tenant charge PDF.

#### Scenario: Download charges PDF as admin

- **WHEN** an admin clicks "Drukuj / Pobierz PDF" in the Naliczenia card on the admin apartment detail page
- **THEN** a PDF file is downloaded containing all charges for that apartment

#### Scenario: Admin charge PDF filename

- **WHEN** an admin downloads a charge PDF
- **THEN** the filename follows the pattern `naliczenia-{apartmentAddress}-{date}.pdf`

### Requirement: Admin Payment PDF Export

The system SHALL allow an admin to download a PDF of the payment history for any apartment and year directly from the admin apartment detail page. Each payment year section in the "Historia wpłat" card SHALL include its own "Drukuj / Pobierz PDF" button. The PDF content and format SHALL match the tenant payment PDF.

#### Scenario: Download payments PDF as admin

- **WHEN** an admin clicks "Drukuj / Pobierz PDF" within a payment year section in the Historia wpłat card
- **THEN** a PDF file is downloaded containing the payment history for that apartment and year

#### Scenario: Admin payment PDF filename

- **WHEN** an admin downloads a payment PDF
- **THEN** the filename follows the pattern `wplaty-{apartmentAddress}-{year}.pdf`

### Requirement: On-demand PDF bundle loading

The PDF generation library SHALL be loaded on demand (only when the user clicks the download button) to avoid impacting initial page load performance.

#### Scenario: Initial page load unaffected

- **WHEN** a user (tenant or admin) navigates to a charges or payments detail page
- **THEN** the PDF library bundle is not loaded until the download button is clicked
