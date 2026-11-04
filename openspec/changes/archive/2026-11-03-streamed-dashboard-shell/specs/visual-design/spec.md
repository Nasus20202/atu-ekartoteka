## ADDED Requirements

### Requirement: Streamed Page Sections

Every page that loads data SHALL render its static shell immediately and show each
independent data section behind its own loading boundary, with a skeleton and a
fade-in when the content replaces it. A section SHALL appear as soon as its own data
is ready, without waiting for the others.

#### Scenario: Slow data load

- **WHEN** a signed-in user opens a page and one section's data takes time to load
- **THEN** the shell and every ready section are visible while that section shows its skeleton
- **AND** the section fades in without shifting the layout when its data arrives

#### Scenario: Skeleton shape

- **WHEN** a skeleton is shown
- **THEN** it uses the shared `Skeleton` primitive and reserves the dimensions of the final content to avoid layout shift
- **AND** it is hidden from assistive technology

#### Scenario: Reduced motion

- **GIVEN** the user prefers reduced motion
- **WHEN** a skeleton is shown
- **THEN** it does not pulse

### Requirement: Page Loading Uses Skeletons

A page that loads its data SHALL show skeletons of its own layout, not a spinner card
or a text placeholder. Spinners remain only for an action in progress, such as a
button submitting.

#### Scenario: Admin list loading

- **WHEN** an admin opens an admin list page and its data is not ready
- **THEN** the page header and controls are visible and the list area shows a skeleton of its cards or rows

### Requirement: Route Loading States

Every route that loads data SHALL have a route loading state that mirrors the route's
static layout (heading and skeletons), so that a client navigation shows the destination
page at once while its data loads.

#### Scenario: Client navigation

- **GIVEN** a signed-in user on the dashboard
- **WHEN** they follow a link to the charges page
- **THEN** the charges heading and skeletons are shown at once, before the server responds
- **AND** the content replaces the skeletons when it arrives

## MODIFIED Requirements

### Requirement: List View — Default and Remembered View

Cards SHALL be the default view. The chosen view SHALL be remembered separately for the apartments list and the users list in the admin's browser, and SHALL be restored when that list is opened again. The choice SHALL also be kept in a cookie, so the server renders the remembered view and its loading skeleton in the first response, with no switch after hydration. If the browser cannot store it, the switch SHALL still work for the current visit.

#### Scenario: First visit shows cards

- **GIVEN** an admin who has never used the switch in this browser
- **WHEN** they open the apartments list
- **THEN** the cards view is shown

#### Scenario: Choice restored on return

- **GIVEN** an admin selected `Tabela` on the apartments list
- **WHEN** they reload the page or open another HOA's apartments
- **THEN** the table view is shown

#### Scenario: Lists remember independently

- **GIVEN** an admin selected `Tabela` on the apartments list
- **WHEN** they open the users list for the first time
- **THEN** the users list shows cards

#### Scenario: Storage unavailable

- **GIVEN** the browser blocks site storage
- **WHEN** the admin selects `Tabela`
- **THEN** the table view is shown for the current page without an error

#### Scenario: Server renders the remembered view

- **GIVEN** an admin selected `Tabela` on the users list
- **WHEN** they reload the page
- **THEN** the first response already contains the table, and the loading skeleton is a table skeleton, not cards
