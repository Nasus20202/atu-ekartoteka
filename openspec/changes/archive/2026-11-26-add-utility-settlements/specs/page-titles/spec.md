# Spec Delta

## MODIFIED Requirements

### Requirement: Tenant Page Titles

The tenant pages SHALL use the titles `Zmiana hasła` (`/change-password`), `Profil` (`/dashboard/profile`), `Naliczenia` (`/dashboard/charges`), `Wpłaty` (`/dashboard/payments`) and `Rozliczenia` (`/dashboard/settlements`).

#### Scenario: Charges list

- **GIVEN** a signed-in tenant
- **WHEN** they open the charges list
- **THEN** the document title is `Naliczenia | ATU Ekartoteka`

#### Scenario: Settlements page

- **GIVEN** a signed-in tenant
- **WHEN** they open the settlements page
- **THEN** the document title is `Rozliczenia | ATU Ekartoteka`
