## MODIFIED Requirements

### Requirement: HOA Listing

The system SHALL allow admins to list all homeowners associations in the system, including their import dates.

#### Scenario: HOA card shows import dates

- **GIVEN** an authenticated admin on the HOA list page
- **WHEN** the page loads
- **THEN** each HOA card displays `apartmentsDataDate`, `chargesDataDate`, and `notificationsDataDate` (when set), formatted as a readable date in Polish locale
- **AND** the card does NOT show financial summary values (totalClosingBalance, totalChargesDue)

#### Scenario: HOA card with missing import dates

- **GIVEN** an HOA that has never been imported
- **WHEN** the admin views the HOA card
- **THEN** the import date fields are not rendered (no placeholder or dash shown)
