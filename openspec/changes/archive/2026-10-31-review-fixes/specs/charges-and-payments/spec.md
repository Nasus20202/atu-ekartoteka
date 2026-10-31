## MODIFIED Requirements

### Requirement: Share Precision with Trailing Zero Removal

The system SHALL display the ownership share percentage, formatted from the apartment's database share ratio with a decimal comma (Polish locale), rounded to 4 decimal places with trailing zeros stripped and no thousands grouping, in all views.

#### Scenario: Share shown without trailing zeros in apartment card

- **GIVEN** an apartment with `shareNumerator = 57.5` and `shareDenominator = 1000`, so the stored ratio is 0.0575
- **WHEN** the apartment card renders on the tenant dashboard
- **THEN** the share percentage is shown as `5,75%` (rounded to 4 decimals, trailing zeros removed)

#### Scenario: Share shown without trailing zeros in payment details

- **GIVEN** an apartment with a computed share percentage
- **WHEN** the `PaymentApartmentDetailsCard` renders
- **THEN** the "Procent udziału" field shows the percentage rounded to 4 decimals with trailing zeros stripped

#### Scenario: Share shows fallback when no denominator

- **GIVEN** an apartment with `shareDenominator = 0` or `null`, so the stored ratio is unknown
- **WHEN** any view renders the share
- **THEN** no percentage is shown: the view shows its placeholder or omits the share

#### Scenario: Zero share

- **GIVEN** an apartment with `shareNumerator = 0` and `shareDenominator = 1000`
- **WHEN** any view renders the share
- **THEN** the share is shown as `0%`
