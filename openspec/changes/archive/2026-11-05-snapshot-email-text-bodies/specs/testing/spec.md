# Spec Delta

## MODIFIED Requirements

### Requirement: Email Template Tests

Email templates SHALL be covered by unit tests and visual screenshot tests.

#### Scenario: Unit tests per template

- **GIVEN** each of the five template pairs
- **WHEN** the unit tests run
- **THEN** they assert that all placeholders are substituted, user-supplied values are HTML-escaped in HTML and left as is in text, links are absolute and based on `APP_URL`, and the text variant contains the same links and values

#### Scenario: Plain-text bodies are pinned

- **GIVEN** each of the five email types rendered with fixed inputs
- **WHEN** the unit tests run
- **THEN** the complete plain-text body is compared with a stored snapshot, so any wording or layout change fails until the snapshot is updated

#### Scenario: Email screenshots

- **GIVEN** the visual suite
- **WHEN** it runs
- **THEN** each email is rendered with fixed variables and compared with a stored screenshot at desktop and phone viewports
