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

### Requirement: Dynamic Route Titles Are Static

Pages whose route has a dynamic segment (an HOA, an apartment or a payment year)
SHALL use a static title that does not depend on the session or the database, so
that a navigation to them is never blocked by a title lookup. The titles are
`Mieszkania wspólnoty` (admin HOA page), `Lokal` (admin apartment page),
`Naliczenia mieszkania` (tenant charges page) and `Wpłaty mieszkania` (tenant payment
year page), followed by the app name.

#### Scenario: Admin opens an HOA page

- **GIVEN** an admin
- **WHEN** they open the apartments page of HOA `KLO11`
- **THEN** the document title is `Mieszkania wspólnoty | ATU Ekartoteka` and the HOA name is not in it

#### Scenario: Tenant opens an apartment page

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12`
- **WHEN** they open that apartment's charges or its 2025 payments
- **THEN** the document title is `Naliczenia mieszkania | ATU Ekartoteka` or `Wpłaty mieszkania | ATU Ekartoteka`
- **AND** the address is not in the title

#### Scenario: Navigation is not blocked

- **WHEN** a user follows a link to one of these pages
- **THEN** the page skeleton is shown without waiting for a title lookup
