# Spec Delta

## ADDED Requirements

### Requirement: Window Applies to Settlements

The system SHALL show tenants only utility settlements, annual cost settlements and meter readings whose settlement period ends in the window's start year or later.

#### Scenario: Old settlement hidden

- **GIVEN** a window start year of 2024 and a utility settlement ending on 2022-09-30
- **WHEN** the tenant views the settlements page
- **THEN** that settlement and its meter readings are not shown but remain stored

#### Scenario: Period selector

- **GIVEN** settlements inside and outside the window
- **WHEN** the tenant opens the `Okres` select
- **THEN** only periods inside the window are listed
