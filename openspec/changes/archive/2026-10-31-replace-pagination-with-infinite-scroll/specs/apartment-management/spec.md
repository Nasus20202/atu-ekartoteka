# Spec Delta

## ADDED Requirements

### Requirement: HOA Apartment List Infinite Scroll

The admin HOA apartments page (`/admin/apartments/[hoaId]`) SHALL load apartments with infinite scrolling as defined by the infinite scrolling requirements in `visual-design`, in natural building/number order. The `search` and `activeOnly` URL parameters SHALL drive the list; a `page` URL parameter SHALL be ignored and never written.

#### Scenario: Scrolling loads further apartments

- **GIVEN** a HOA with 70 apartments and a page size of 20
- **WHEN** the admin opens the HOA apartments page and scrolls to the end three times
- **THEN** all 70 apartments are shown in one list in natural building/number order with no duplicates
- **AND** the `Znaleziono 70 mieszkań` count is shown from the first load

#### Scenario: Search restarts the list

- **GIVEN** the admin has scrolled through several pages
- **WHEN** they submit a search or toggle `Tylko aktywne`
- **THEN** the URL `search`/`activeOnly` parameters are updated and the list restarts from the first matching apartments

#### Scenario: Legacy page parameter ignored

- **GIVEN** a bookmarked URL `/admin/apartments/<hoaId>?page=3`
- **WHEN** the admin opens it
- **THEN** the list starts from the first apartment

#### Scenario: Duplicate active address highlighted across loaded pages

- **GIVEN** two active apartments with the same address, building and number that fall on different API pages
- **WHEN** both have been loaded by scrolling
- **THEN** both cards are marked as duplicates
