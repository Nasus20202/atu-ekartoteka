# Spec Delta

## ADDED Requirements

### Requirement: Owner Since on Apartment Detail

The admin apartment detail page SHALL show the date from which the current owner has owned the apartment, labelled `Właściciel od`. The date SHALL be formatted with the same date format used on the import result card. When the apartment has no start date, the page SHALL show `Brak`.

#### Scenario: Owner since shown

- **GIVEN** an apartment with `validFrom` set to 2025-02-10
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Właściciel od` with the date 10.02.2025

#### Scenario: No start date

- **GIVEN** an apartment with `validFrom` null
- **WHEN** an admin opens the apartment detail page
- **THEN** the page shows `Właściciel od` with the value `Brak`

#### Scenario: Not shown to tenants

- **GIVEN** a tenant opens the dashboard for their assigned apartment
- **WHEN** the page loads
- **THEN** the owner-since date is not shown
