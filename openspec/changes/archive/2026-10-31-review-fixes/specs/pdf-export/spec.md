## ADDED Requirements

### Requirement: PDF Generation Date

Every generation date printed in a PDF, and the date in the notice PDF filename, SHALL be the calendar date in the browser's local time zone, not the UTC date.

#### Scenario: Download shortly after midnight

- **GIVEN** a tenant in Poland on 2026-11-01 at 00:30 local time
- **WHEN** they download the notice PDF
- **THEN** the file is named `naliczenia-biezace-2026-11-01.pdf` and the PDF shows the generation date 2026-11-01

## MODIFIED Requirements

### Requirement: Notice PDF Layout

The notice PDF SHALL contain one A4 page per apartment. Each page SHALL show the title with the apartment label and HOA name, then the apartment's HOA header text with its line breaks kept, then a table of notice items (description, quantity with unit, unit price, total), a total row, and the HOA footer text when there is one.

#### Scenario: One page per apartment

- **GIVEN** a tenant with notices for two apartments
- **WHEN** the PDF is generated
- **THEN** it has two pages, each containing only that apartment's items and total

#### Scenario: Same label in two HOAs

- **GIVEN** a tenant with notices for apartment `ul. Lipowa 1/2` in two different HOAs
- **WHEN** the PDF is generated
- **THEN** it has a separate page for each HOA's apartment, each with its own HOA name, header, footer, items and total

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
