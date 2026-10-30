# Spec Delta

## ADDED Requirements

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
