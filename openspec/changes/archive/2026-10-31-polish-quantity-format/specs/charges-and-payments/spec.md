## ADDED Requirements

### Requirement: Quantity Formatting

The system SHALL display charge and notice quantities with a Polish decimal comma and their full stored precision, in tenant views, admin views and PDFs.

#### Scenario: Fractional quantity

- **GIVEN** a notice item with quantity 50.5 and unit `m2`
- **WHEN** it is shown in the `Powiadomienia` card, the admin notifications card, a charge list or a PDF
- **THEN** the quantity reads `50,5 m2`

#### Scenario: Whole quantity

- **GIVEN** a charge item with quantity 1 and unit `szt`
- **WHEN** it is shown
- **THEN** the quantity reads `1 szt`
