# Spec Delta

## ADDED Requirements

### Requirement: Current Tenant Navigation Item

The tenant navbar SHALL visually mark the link of the current page, including its nested pages, and expose it to assistive technologies as the current page.

#### Scenario: On the settlements page

- **GIVEN** a tenant on `/dashboard/settlements`
- **WHEN** the navbar or the mobile menu renders
- **THEN** the `Rozliczenia` link is highlighted and marked as the current page

#### Scenario: On another page

- **GIVEN** a tenant on the dashboard home page
- **WHEN** the navbar renders
- **THEN** the `Rozliczenia` link is not marked
