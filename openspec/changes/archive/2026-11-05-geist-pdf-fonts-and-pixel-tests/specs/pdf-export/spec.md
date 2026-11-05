# Spec Delta

## ADDED Requirements

### Requirement: PDF Typeface

Every PDF document SHALL be set in the Geist typeface, in its Regular and Bold weights. Text that is styled bold SHALL appear in the bold weight rather than being approximated from the regular weight. No PDF document SHALL use Roboto.

#### Scenario: Bold text is printed in bold

- **GIVEN** a charge, payment, or notice PDF with a title, table header, or total row
- **WHEN** the PDF is generated
- **THEN** those texts are drawn with the Geist Bold weight

#### Scenario: Body text uses Geist Regular

- **GIVEN** a PDF with descriptions, quantities, and amounts
- **WHEN** the PDF is generated
- **THEN** that text is drawn with the Geist Regular weight

#### Scenario: Polish characters in Geist

- **WHEN** a PDF contains Polish diacritics in its regular or bold text
- **THEN** every diacritic is drawn with the Geist glyphs and none is replaced by a placeholder

---

### Requirement: PDF Pixel Regression

The system SHALL verify the rendered appearance of the charge, payment, and current notice PDFs by comparing their rendered pages with stored baseline images. A PDF's visual output SHALL NOT change unless its baseline is deliberately updated.

#### Scenario: Each PDF type has a baseline

- **GIVEN** the visual test suite
- **WHEN** it runs
- **THEN** the charge, payment, and notice PDFs are each downloaded from the visual app with fixed data and every page is compared with a stored baseline image

#### Scenario: Font change is detected

- **GIVEN** a PDF whose text is drawn in a different typeface or weight than its baseline
- **WHEN** the visual test runs
- **THEN** the test fails

#### Scenario: Generation date is pinned

- **GIVEN** a PDF that prints its generation date
- **WHEN** the visual test runs with the visual app's fixed clock
- **THEN** the date in the baseline does not depend on the day the test runs

#### Scenario: Baselines are updated on request

- **WHEN** a developer runs the visual update script
- **THEN** the PDF baselines are regenerated alongside the page screenshots
