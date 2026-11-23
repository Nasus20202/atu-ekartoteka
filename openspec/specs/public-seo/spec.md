# public-seo Specification

## Purpose

Makes the pages a signed-out visitor can open findable and shareable: each one carries its own title, description, canonical URL and social preview, while the rest of the application stays out of search results.

## Requirements

### Requirement: Public Pages Are Indexable

The pages `/login`, `/register`, `/forgot-password` and `/privacy` SHALL declare themselves indexable and followable, and SHALL declare a canonical URL equal to their own path.

#### Scenario: Crawler opens the sign-in page

- **WHEN** a crawler requests `/login`
- **THEN** the page declares `index, follow`
- **AND** its canonical URL is `/login`

#### Scenario: Every public page has a canonical URL

- **WHEN** a crawler requests `/register`, `/forgot-password` or `/privacy`
- **THEN** the canonical URL matches that page's path

### Requirement: Private Pages Stay Out of the Index

Every route other than the public pages SHALL declare `noindex, nofollow` by default, so a page added later is private until it opts in.

#### Scenario: Token page is not indexed

- **WHEN** a crawler requests `/reset-password?token=...` or `/verify-email?token=...`
- **THEN** the page declares `noindex, nofollow`

#### Scenario: Signed-in pages are not indexed

- **WHEN** a crawler requests `/dashboard/profile` or `/admin/users`
- **THEN** the page declares `noindex, nofollow`

### Requirement: Each Public Page Describes Itself

Each public page SHALL have a description in Polish that names the application and says what the page is for. No two public pages SHALL share the same description.

#### Scenario: Sign-in page description

- **WHEN** a crawler reads the description of `/login`
- **THEN** it explains that this is where a resident signs in to see their own charges and payments

#### Scenario: Descriptions are distinct

- **WHEN** the descriptions of all public pages are compared
- **THEN** every page has a different one

### Requirement: Public Pages Provide a Social Preview

Each public page SHALL declare Open Graph metadata of type `website` with the site name `ATU Ekartoteka` and locale `pl_PL`, and a Twitter card of type `summary`, all carrying the page title with the application name and the page description.

#### Scenario: Sharing the registration page

- **WHEN** a visitor shares `/register`
- **THEN** the preview shows `Rejestracja | ATU Ekartoteka` and the registration description as Open Graph title and description
- **AND** the Twitter card carries the same title and description

### Requirement: Public Pages Stay Prerendered

The public pages SHALL be prerendered at build time. Their metadata SHALL NOT read the request, the session or runtime configuration, and SHALL NOT contain a host, so the pages can be served as static HTML.

#### Scenario: Build output

- **WHEN** the application is built
- **THEN** `/login`, `/register`, `/forgot-password` are listed as static routes
- **AND** no page becomes dynamic because of its metadata

### Requirement: Crawler Rules Keep Out Private Sections

`robots.txt` SHALL allow every path, except `/api/`, `/dashboard` and `/admin`. It SHALL be served without reading the request.

#### Scenario: Crawler reads robots.txt

- **WHEN** a crawler requests `/robots.txt`
- **THEN** it may crawl `/` and is denied `/api/`, `/dashboard` and `/admin`
