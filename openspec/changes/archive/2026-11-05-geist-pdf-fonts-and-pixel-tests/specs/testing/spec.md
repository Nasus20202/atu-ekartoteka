# Spec Delta

## ADDED Requirements

### Requirement: PDF Visual Regression Tests

The system SHALL keep pixel-level regression tests for the generated PDF documents in `e2e/visual/`. The tests SHALL render every page of each PDF to an image and compare it with a committed baseline image, at the desktop viewport only.

#### Scenario: PDF documents are covered

- **GIVEN** the visual suite
- **WHEN** it runs
- **THEN** the charge, payment, and current notice PDFs each have at least one rendered-page comparison

#### Scenario: Pixel differences fail the test

- **GIVEN** a rendered PDF page that differs from its baseline by more than the configured tolerance
- **WHEN** the visual test runs
- **THEN** the test fails and the actual image is written to the test results

#### Scenario: Visual app fixes the clock

- **GIVEN** a PDF test running against the visual app
- **WHEN** the PDF is generated
- **THEN** the app uses the fixed clock so the printed date matches the baseline on any day
