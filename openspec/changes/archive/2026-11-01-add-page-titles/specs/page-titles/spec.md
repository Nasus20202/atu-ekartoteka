## ADDED Requirements

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

#### Scenario: Error page title

- **WHEN** the application error page is shown
- **THEN** the document title is `Coś poszło nie tak! | ATU Ekartoteka`

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

#### Scenario: Tenant opens an admin page

- **GIVEN** a tenant who requests an admin HOA page
- **WHEN** the page title is generated
- **THEN** the title is `Mieszkania wspólnoty | ATU Ekartoteka`, the HOA name is not read from the database, and the name does not appear in the title

### Requirement: Tenant Apartment Titles Show Only Owned Addresses

The tenant charge page SHALL use `Naliczenia - <address label>` and the payment year page SHALL use `Wpłaty <year> - <address label>`, where the address label is the apartment's address and number. The address label SHALL appear only when the signed-in user owns the apartment. For any other apartment, or for an invalid year, the title SHALL be the generic `Naliczenia mieszkania` or `Wpłaty mieszkania`.

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
- **THEN** the document title is `Naliczenia mieszkania | ATU Ekartoteka` and the address is not shown

#### Scenario: Invalid payment year

- **GIVEN** a tenant who owns apartment `Mickiewicza 3/12`
- **WHEN** they open the payments of that apartment for year `abc`
- **THEN** the document title is `Wpłaty mieszkania | ATU Ekartoteka`

### Requirement: Not-Found Page Titles

The not-found pages SHALL set the titles `Strona nie znaleziona` for unknown routes and `Mieszkanie nie znalezione` for an apartment charges page that does not exist.

#### Scenario: Unknown route

- **WHEN** a user opens a route that does not exist
- **THEN** the document title is `Strona nie znaleziona | ATU Ekartoteka`

#### Scenario: Unknown apartment

- **WHEN** a user opens the charges page of an apartment that does not exist
- **THEN** the document title is `Mieszkanie nie znalezione | ATU Ekartoteka`
