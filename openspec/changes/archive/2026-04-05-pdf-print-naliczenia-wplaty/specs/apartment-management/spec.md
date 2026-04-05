## MODIFIED Requirements

### Requirement: Admin Apartment Detail and Assignment

The system SHALL allow admins to view a specific apartment's details and assign or unassign it to a tenant user. The admin apartment detail page SHALL include PDF download buttons: one in the "Naliczenia" card to download all charges for that apartment, and one per payment year in the "Historia wpłat" card to download the payment record for that year.

#### Scenario: View apartment details

- **GIVEN** an authenticated admin
- **WHEN** they fetch a specific apartment by ID
- **THEN** the apartment's full details including owner data and HOA info are returned

#### Scenario: Assign apartment to user

- **GIVEN** an authenticated admin and an unassigned apartment
- **WHEN** the admin updates the apartment with a `userId`
- **THEN** the apartment is linked to that user

#### Scenario: Unassign apartment

- **GIVEN** an authenticated admin and an apartment currently assigned to a user
- **WHEN** the admin sets `userId` to null
- **THEN** the apartment's user assignment is cleared

#### Scenario: PDF download button in Naliczenia card

- **GIVEN** an authenticated admin viewing the apartment detail page
- **WHEN** the page loads and the apartment has charge records
- **THEN** a "Drukuj / Pobierz PDF" button is visible in the Naliczenia card

#### Scenario: PDF download button per payment year in Historia wpłat

- **GIVEN** an authenticated admin viewing the apartment detail page
- **WHEN** the page loads and the apartment has payment records
- **THEN** each payment year section in the Historia wpłat card contains its own "Drukuj / Pobierz PDF" button
