## ADDED Requirements

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

## REMOVED Requirements

### Requirement: Admin Page Titles Show HOA and Apartment Names

**Reason**: Building the title needs the session and a database lookup, which blocks the navigation until it resolves.
**Migration**: Use the static titles from "Dynamic Route Titles Are Static".

### Requirement: Tenant Apartment Titles Show Only Owned Addresses

**Reason**: Same lookup, same blocking; the address no longer appears in any title, so the ownership gate on the title is unnecessary.
**Migration**: Use the static titles from "Dynamic Route Titles Are Static"; ownership is still enforced by the page itself.
