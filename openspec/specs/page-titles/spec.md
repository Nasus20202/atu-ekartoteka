# Capability: Page Titles

## Purpose

Sets the browser document title of every page, and limits which names may appear in it. Admin HOA and apartment names are shown only to admins, and tenant apartment addresses only to the apartment owner.

## Requirements

### Requirement: Document Title Template

Every page SHALL set a browser document title in the form `<page title> | ATU Ekartoteka`. Page titles SHALL be in Polish. A page without its own title SHALL use the bare name `ATU Ekartoteka`.

#### Scenario: Page with a title

- **GIVEN** a signed-in tenant
- **WHEN** they open the profile page
- **THEN** the document title is `Profil | ATU Ekartoteka`

#### Scenario: Dashboard home

- **GIVEN** a signed-in tenant
- **WHEN** they open the dashboard home page
- **THEN** the document title is `ATU Ekartoteka`

### Requirement: Sign-In Page Titles

The sign-in pages SHALL use the titles `Logowanie` (`/login`), `Rejestracja` (`/register`), `Przywracanie hasła` (`/forgot-password`), `Ustaw nowe hasło` (`/reset-password`) and `Weryfikacja email` (`/verify-email`).

#### Scenario: Login page

- **WHEN** a visitor opens `/login`
- **THEN** the document title is `Logowanie | ATU Ekartoteka`

### Requirement: Tenant Page Titles

The tenant pages SHALL use the titles `Zmiana hasła` (`/change-password`), `Profil` (`/dashboard/profile`), `Naliczenia` (`/dashboard/charges`) and `Wpłaty` (`/dashboard/payments`).

#### Scenario: Charges list

- **GIVEN** a signed-in tenant
- **WHEN** they open the charges list
- **THEN** the document title is `Naliczenia | ATU Ekartoteka`

### Requirement: Admin Static Page Titles

The admin pages SHALL use the titles `Wspólnoty mieszkaniowe` (`/admin/apartments`), `Użytkownicy` (`/admin/users`), `Zarządzanie kontami` (`/admin/users/management`), `Import danych` (`/admin/import`) and `Ustawienia` (`/admin/settings`).

#### Scenario: Admin HOA list

- **GIVEN** an admin
- **WHEN** they open the HOA list
- **THEN** the document title is `Wspólnoty mieszkaniowe | ATU Ekartoteka`

#### Scenario: Nested account management page

- **GIVEN** an admin
- **WHEN** they open the account management page under `/admin/users`
- **THEN** the document title is `Zarządzanie kontami | ATU Ekartoteka`

### Requirement: Nested Page Titles Keep the App Name

A layout that sets a title and has nested pages SHALL keep the app template for those pages, so every title ends with `| ATU Ekartoteka`.

#### Scenario: Apartment page under a HOA layout

- **GIVEN** an admin
- **WHEN** they open apartment 1A of HOA `Test HOA`
- **THEN** the document title ends with `| ATU Ekartoteka`

### Requirement: Admin Page Titles Show HOA and Apartment Names

The admin HOA page SHALL use the HOA name as its title, and the admin apartment page SHALL use `Lokal <number> - <HOA name>`. Only admins SHALL see these names in titles. Non-admins SHALL get the generic titles `Mieszkania wspólnoty` (HOA) and `Lokal` (apartment), and the title lookup SHALL NOT query the database for them.

#### Scenario: Admin opens an HOA page

- **GIVEN** an admin
- **WHEN** they open the apartments page of HOA `KLO11`
- **THEN** the document title is `KLO11 | ATU Ekartoteka`

#### Scenario: Admin opens an apartment page

- **GIVEN** an admin
- **WHEN** they open apartment 12 of HOA `KLO11`
- **THEN** the document title is `Lokal 12 - KLO11 | ATU Ekartoteka`

#### Scenario: Unknown HOA for an admin

- **GIVEN** an admin
- **WHEN** they open the apartments page of an HOA id that does not exist
- **THEN** the document title is `Mieszkania wspólnoty | ATU Ekartoteka`

#### Scenario: Unknown apartment for an admin

- **GIVEN** an admin
- **WHEN** they open the page of an apartment id that does not exist
- **THEN** the document title is `Lokal | ATU Ekartoteka`

#### Scenario: Tenant opens an admin HOA page

- **GIVEN** a tenant who requests an admin HOA page
- **WHEN** the page title is generated
- **THEN** the title is `Mieszkania wspólnoty | ATU Ekartoteka`, the HOA name is not read from the database, and the name does not appear in the title

### Requirement: Tenant Apartment Titles Show Only Owned Addresses

The tenant charges page SHALL use `Naliczenia - <address label>` and the payment year page SHALL use `Wpłaty <year> - <address label>`, where the address label is the apartment's address, building and number. The address label SHALL appear only when the signed-in user owns the apartment and their account is approved. For any other apartment, or for an invalid year, the title SHALL be the generic `Naliczenia mieszkania` or `Wpłaty mieszkania`.

#### Scenario: Owner opens their charges

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12`
- **WHEN** they open that apartment's charges
- **THEN** the document title is `Naliczenia - Mickiewicza 3/12 | ATU Ekartoteka`

#### Scenario: Owner opens payments for a year

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12`
- **WHEN** they open the 2025 payments of that apartment
- **THEN** the document title is `Wpłaty 2025 - Mickiewicza 3/12 | ATU Ekartoteka`

#### Scenario: Apartment not owned by the user

- **GIVEN** a tenant who does not own apartment `apt-9`
- **WHEN** they open the charges of `apt-9`
- **THEN** the page responds with not found, the document title is `Naliczenia mieszkania | ATU Ekartoteka`, and the address is not shown

#### Scenario: Apartment that does not exist

- **GIVEN** a tenant
- **WHEN** they open the charges of an apartment id that does not exist
- **THEN** the page responds with not found and the document title is `Naliczenia mieszkania | ATU Ekartoteka`

#### Scenario: Owner whose account is not approved

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12` and whose account is not approved
- **WHEN** the charges title is generated
- **THEN** the title is `Naliczenia mieszkania | ATU Ekartoteka` and the address is not shown

#### Scenario: Invalid payment year

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12`
- **WHEN** they open the payments of that apartment for year `abc`
- **THEN** the page responds with not found and the document title is `Wpłaty mieszkania | ATU Ekartoteka`

### Requirement: Not-Found Page Titles

The root not-found page SHALL set the title `Strona nie znaleziona` for unknown routes. An unknown or unowned apartment does not have its own not-found title; its charges and payments pages use the generic titles from the tenant requirement.

#### Scenario: Unknown route

- **WHEN** a user opens a route that does not exist
- **THEN** the document title is `Strona nie znaleziona | ATU Ekartoteka`

### Requirement: Error Page Titles

The application error page SHALL set the title `Coś poszło nie tak!`, and the charges error page SHALL set the title `Wystąpił błąd`. Both titles SHALL use the app template.

#### Scenario: Application error page

- **WHEN** the application error page is shown
- **THEN** the document title is `Coś poszło nie tak! | ATU Ekartoteka`

#### Scenario: Charges error page

- **GIVEN** a tenant
- **WHEN** the charges page for an apartment fails to load
- **THEN** the document title is `Wystąpił błąd | ATU Ekartoteka`
