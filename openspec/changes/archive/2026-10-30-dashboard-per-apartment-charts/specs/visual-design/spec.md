# Spec Delta

## ADDED Requirements

### Requirement: Financial Charts Show Zero Baseline and Units

The system SHALL render monetary financial charts with a visible zero baseline and readable amount labels.

#### Scenario: Zero reference line shown

- **GIVEN** a payment-year chart or a dashboard financial chart
- **WHEN** it is rendered
- **THEN** a horizontal reference line is drawn at 0
- **AND** the Y-axis domain always includes 0, including when every value is negative

#### Scenario: Zero tick emphasised

- **GIVEN** a financial chart whose Y axis shows a 0 tick
- **WHEN** it is rendered
- **THEN** the 0 tick label is bold while the other tick labels keep the regular weight

#### Scenario: Dashboard amounts show currency

- **GIVEN** a dashboard financial chart
- **WHEN** its Y axis is rendered
- **THEN** tick labels are compact amounts with the `zł` unit, for example `1,2 tys. zł`
