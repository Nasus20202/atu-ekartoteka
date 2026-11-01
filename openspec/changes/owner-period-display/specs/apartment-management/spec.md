# Spec Delta

## REMOVED Requirements

### Requirement: Owner Since on Apartment Detail

**Reason**: Replaced by the owner period field, which also shows the end date of a former owner.

**Migration**: Use the `Okres własności` requirement below.

## ADDED Requirements

### Requirement: Owner Period on Apartment Detail

The admin apartment detail page SHALL show the owner period of the apartment in one field labelled `Okres własności`. The field SHALL show `od` followed by the start date when only the start date is known, `do` followed by the end date when only the end date is known, and `od` start date followed by `do` end date when both are known. When neither date is known, the page SHALL show `Brak`. Dates SHALL be formatted with the same date format used on the import result card.

#### Scenario: Current owner with a start date

- **GIVEN** an apartment with `validFrom` set to 2025-02-10 and `validTo` null
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Okres własności` with the value `od 10.02.2025`

#### Scenario: Former owner with start and end dates

- **GIVEN** an apartment with `validFrom` set to 2025-01-01 and `validTo` set to 2025-02-09
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Okres własności` with the value `od 01.01.2025 do 09.02.2025`

#### Scenario: End date without a start date

- **GIVEN** an apartment with `validFrom` null and `validTo` set to 2025-02-09
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Okres własności` with the value `do 09.02.2025`

#### Scenario: No dates

- **GIVEN** an apartment with `validFrom` null and `validTo` null
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Okres własności` with the value `Brak`

#### Scenario: Not shown to tenants

- **GIVEN** a tenant opens the dashboard for their assigned apartment
- **WHEN** the page loads
- **THEN** the owner period is not shown
