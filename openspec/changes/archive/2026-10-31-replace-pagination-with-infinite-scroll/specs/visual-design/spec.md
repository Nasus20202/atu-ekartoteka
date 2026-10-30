# Spec Delta

## ADDED Requirements

### Requirement: Infinite Scroll — Automatic Loading on Scroll

Admin lists backed by a paginated API SHALL show the first page on load and SHALL append the next page automatically when the end of the list scrolls into view, until every item is loaded. The application SHALL NOT render numbered page controls or previous/next page buttons for these lists.

#### Scenario: Next page appended when reaching the end

- **GIVEN** an admin list whose total exceeds one page
- **WHEN** the admin scrolls so that the end of the list becomes visible
- **THEN** the next page is requested and its items are appended below the already-loaded items
- **AND** the already-loaded items stay in place

#### Scenario: No page controls rendered

- **GIVEN** any admin list covered by this capability
- **WHEN** the list is rendered
- **THEN** no `Poprzednia`, `Następna`, page number or `Strona X z Y` controls are shown

#### Scenario: All items loaded

- **GIVEN** every item of the list has been loaded
- **WHEN** the admin reaches the end of the list
- **THEN** no further request is made and no loading indicator is shown

### Requirement: Infinite Scroll — Loading Feedback While Fetching More

While the next page is being fetched, the list SHALL show a loading indicator below the loaded items and SHALL NOT request the same page twice.

#### Scenario: Loading indicator shown

- **GIVEN** the next page request is in flight
- **WHEN** the admin looks at the end of the list
- **THEN** a spinner with the text `Ładowanie...` is shown below the loaded items

#### Scenario: Concurrent triggers do not duplicate requests

- **GIVEN** the next page request is in flight
- **WHEN** the end of the list leaves and re-enters the viewport
- **THEN** no additional request for that page is made and no item appears twice

### Requirement: Infinite Scroll — Accessible Manual Fallback

Lists SHALL offer a focusable `Pokaż więcej` button at the end of the loaded items while more items remain, so keyboard and assistive-technology users, and browsers without scroll-visibility support, can load the next page.

#### Scenario: Keyboard user loads more

- **GIVEN** more items remain to be loaded
- **WHEN** the admin focuses the `Pokaż więcej` button and activates it with the keyboard
- **THEN** the next page is appended exactly as with automatic loading

#### Scenario: Fallback hidden when list is complete

- **GIVEN** every item has been loaded
- **WHEN** the list is rendered
- **THEN** the `Pokaż więcej` button is not shown

### Requirement: Infinite Scroll — Reset on Query Change

When the admin changes the search text or a filter of a list, the list SHALL discard the loaded items and load the first page for the new query. Responses for an outdated query SHALL be ignored.

#### Scenario: Filter change restarts the list

- **GIVEN** an admin has loaded three pages of a list
- **WHEN** they change a filter or the search text
- **THEN** the list shows only the first page of results for the new query

#### Scenario: Stale response ignored

- **GIVEN** a next-page request for the previous query is still in flight
- **WHEN** the admin changes the query and the old response arrives afterwards
- **THEN** the old items are not added to the new list

### Requirement: Infinite Scroll — Load Failure Handling

If loading the next page fails, the list SHALL keep the already-loaded items, SHALL show an inline error message, and SHALL let the admin retry with the `Pokaż więcej` button.

#### Scenario: Next page request fails

- **GIVEN** an admin has one page loaded
- **WHEN** the next page request fails
- **THEN** the loaded items remain visible
- **AND** the message `Nie udało się wczytać kolejnych pozycji` is shown with a `Pokaż więcej` button that retries the same page
