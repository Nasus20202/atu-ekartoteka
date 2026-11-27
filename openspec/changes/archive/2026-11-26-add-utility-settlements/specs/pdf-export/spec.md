# Spec Delta

## ADDED Requirements

### Requirement: Settlement PDF Export

The settlement views SHALL offer tenants and admins a `Pobierz PDF` button that downloads a PDF of what the active view shows for the chosen apartment and period. The PDF SHALL be generated in the browser, and the PDF library SHALL load only when the button is clicked.

#### Scenario: Utility settlement

- **GIVEN** the `Media` view of a period
- **WHEN** the user clicks `Pobierz PDF`
- **THEN** the file `rozliczenie-mediow-{apartment}-{from}-{to}.pdf` contains the result, each utility with its line details expanded and the period's meter readings

#### Scenario: Meter readings

- **GIVEN** the `Liczniki` view
- **WHEN** the user clicks `Pobierz PDF`
- **THEN** the file `liczniki-{apartment}-{date}.pdf` contains the readings visible to that user

#### Scenario: Annual costs

- **GIVEN** the `Koszty rzeczywiste` view of a year
- **WHEN** the user clicks `Pobierz PDF`
- **THEN** the file `koszty-rzeczywiste-{apartment}-{from}-{to}.pdf` contains every item and the total

#### Scenario: Nothing to export

- **GIVEN** a view without data
- **WHEN** it renders
- **THEN** no button is offered

### Requirement: Settlement PDF Layout

Each settlement PDF SHALL show the community name, apartment label, printed owner name and period, and tables with repeated column headings when they continue on another page. The utility and annual cost PDFs SHALL show a highlighted result worded `nadpłata` or `niedopłata`. The meter PDF's period SHALL span the readings it lists, and its owner name SHALL be the one printed on the chosen period's settlement. Results SHALL NOT rely on colour alone.

#### Scenario: Long table

- **GIVEN** a table that does not fit one page
- **WHEN** the PDF is generated
- **THEN** it continues on the next page with the column headings repeated and no row cut in two

#### Scenario: Polish characters

- **WHEN** a settlement PDF contains Polish diacritics
- **THEN** all characters are legible

### Requirement: Settlement PDF Pixel Regression

The visual tests SHALL compare each settlement PDF type, generated with fixed data, with stored baseline images.

#### Scenario: Layout change detected

- **GIVEN** a settlement PDF that renders differently from its baseline
- **WHEN** the visual tests run
- **THEN** they fail

### Requirement: Document Details In Settlement PDFs

A settlement PDF downloaded by an admin SHALL show the issue date and source file name; one downloaded by a tenant SHALL NOT.

#### Scenario: Tenant download

- **GIVEN** a tenant on the settlements page
- **WHEN** they download a PDF
- **THEN** it holds neither the issue date nor the source file name

### Requirement: Headings Stay With Their Rows

A section or table heading in a settlement PDF SHALL be on the same page as at least the first row below it.

#### Scenario: Section at the end of a page

- **GIVEN** a section that starts where only its heading would fit
- **WHEN** the PDF is generated
- **THEN** the heading moves to the next page with the rows

### Requirement: Complete Text In Every Download

Every PDF the application generates SHALL print all letters of its text and keep them copyable, also when other PDFs were generated earlier in the same page session.

#### Scenario: Second download

- **GIVEN** a user who has already downloaded a PDF without reloading the page
- **WHEN** they download another one
- **THEN** no letter is missing from it
