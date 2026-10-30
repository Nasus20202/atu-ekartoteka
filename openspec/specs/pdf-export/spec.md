# Capability: PDF Export

## Purpose

Enables tenant and admin users to download PDF documents of charge and payment data directly from the browser, without a server round-trip. The PDF library is loaded on demand to preserve initial page load performance.

## Requirements

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

---

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

---

### Requirement: Admin Charge PDF Export

The system SHALL allow an admin to download a PDF of the itemized charges for any apartment directly from the admin apartment detail page. The "Drukuj / Pobierz PDF" button SHALL appear in the "Naliczenia" card. The PDF content and format SHALL match the tenant charge PDF.

#### Scenario: Download charges PDF as admin

- **WHEN** an admin clicks "Drukuj / Pobierz PDF" in the Naliczenia card on the admin apartment detail page
- **THEN** a PDF file is downloaded containing all charges for that apartment

#### Scenario: Admin charge PDF filename

- **WHEN** an admin downloads a charge PDF
- **THEN** the filename follows the pattern `naliczenia-{apartmentAddress}-{date}.pdf`

---

### Requirement: Admin Payment PDF Export

The system SHALL allow an admin to download a PDF of the payment history for any apartment and year directly from the admin apartment detail page. Each payment year section in the "Historia wpłat" card SHALL include its own "Drukuj / Pobierz PDF" button. The PDF content and format SHALL match the tenant payment PDF.

#### Scenario: Download payments PDF as admin

- **WHEN** an admin clicks "Drukuj / Pobierz PDF" within a payment year section in the Historia wpłat card
- **THEN** a PDF file is downloaded containing the payment history for that apartment and year

#### Scenario: Admin payment PDF filename

- **WHEN** an admin downloads a payment PDF
- **THEN** the filename follows the pattern `wplaty-{apartmentAddress}-{year}.pdf`

---

### Requirement: On-demand PDF bundle loading

The PDF generation library SHALL be loaded on demand (only when the user clicks the download button) to avoid impacting initial page load performance.

#### Scenario: Initial page load unaffected

- **WHEN** a user (tenant or admin) navigates to a charges or payments detail page
- **THEN** the PDF library bundle is not loaded until the download button is clicked

### Requirement: Current Charge Notice PDF Export

The system SHALL let a tenant download a PDF of their current charge notices from the dashboard `Powiadomienia` card. The PDF SHALL be generated in the browser, and the PDF library SHALL load only when the button is clicked.

#### Scenario: Button placement

- **GIVEN** an approved tenant with current charge notifications
- **WHEN** they view the dashboard
- **THEN** a `Pobierz PDF` button is shown on the right side of the `Łączna kwota do zapłaty` box in the `Powiadomienia` card

#### Scenario: Download notice PDF

- **GIVEN** the notice PDF button is visible
- **WHEN** the tenant clicks it
- **THEN** a PDF covering every notice shown in the card is downloaded

#### Scenario: No notifications

- **GIVEN** a tenant without current charge notifications
- **WHEN** they view the dashboard
- **THEN** neither the `Powiadomienia` card nor the button is shown

#### Scenario: Download filename for notice

- **WHEN** a notice PDF is downloaded
- **THEN** the filename follows the pattern `naliczenia-biezace-{YYYY-MM-DD}.pdf`

---

### Requirement: Notice PDF Layout

The notice PDF SHALL contain one A4 page per apartment. Each page SHALL show the title with the apartment label and HOA name, then the apartment's HOA header text with its line breaks kept, then a table of notice items (description, quantity with unit, unit price, total), a total row, and the HOA footer text when there is one.

#### Scenario: One page per apartment

- **GIVEN** a tenant with notices for two apartments
- **WHEN** the PDF is generated
- **THEN** it has two pages, each containing only that apartment's items and total

#### Scenario: HOA header printed

- **GIVEN** an apartment whose HOA has header text
- **WHEN** its page is generated
- **THEN** the header text appears below the page title and above the items table, with its line breaks kept

#### Scenario: Missing header or footer

- **GIVEN** an apartment whose HOA has no header or footer text
- **WHEN** its page is generated
- **THEN** the page is generated without that section and no placeholder text is shown

#### Scenario: Totals match screen

- **WHEN** a notice PDF is generated
- **THEN** each page's total equals the apartment subtotal shown in the `Powiadomienia` card

#### Scenario: Polish characters render correctly in notice PDF

- **WHEN** a notice PDF contains Polish diacritics
- **THEN** all characters are legible and not rendered as placeholder boxes
