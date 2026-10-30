# Spec Delta

## MODIFIED Requirements

### Requirement: Payment Year Switcher

The system SHALL let a tenant switch between the payment years of an apartment that are inside the tenant history window from its payment detail page.

#### Scenario: Year switcher shown for several years

- **GIVEN** an apartment owned by the tenant with more than one visible payment year
- **WHEN** they view `/dashboard/payments/<apartmentId>/<year>`
- **THEN** the page header shows a `Rok` select listing every visible year newest first, with the current year selected

#### Scenario: Choosing a year navigates

- **GIVEN** the year switcher is visible
- **WHEN** the tenant chooses another year
- **THEN** they are taken to `/dashboard/payments/<apartmentId>/<chosen year>`

#### Scenario: Year switcher hidden for one year

- **GIVEN** an apartment with a single visible payment year
- **WHEN** the tenant views its payment detail page
- **THEN** no year switcher is shown
