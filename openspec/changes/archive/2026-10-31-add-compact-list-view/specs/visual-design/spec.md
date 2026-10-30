# Spec Delta

## ADDED Requirements

### Requirement: List View — View Switch on Admin Lists

The HOA apartments list and the admin users list SHALL show a view switch with two options, `Kafelki` (cards) and `Tabela`. Selecting an option SHALL re-render the already-loaded items in that view without a new request and without changing search, filters or loaded pages.

#### Scenario: Switching to the table view

- **GIVEN** an admin on the HOA apartments list in cards view with 40 apartments loaded
- **WHEN** they select `Tabela`
- **THEN** the same 40 apartments are shown in a table
- **AND** no new list request is made and the search and `Tylko aktywne` state are unchanged

#### Scenario: Switching back to cards

- **GIVEN** an admin on the users list in table view
- **WHEN** they select `Kafelki`
- **THEN** the loaded users are shown as cards again with the active filter kept

#### Scenario: Infinite scrolling works in both views

- **GIVEN** the table view is selected and more items remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows in the selected sort order

### Requirement: List View — Default and Remembered View

Cards SHALL be the default view. The chosen view SHALL be remembered separately for the apartments list and the users list in the admin's browser, and SHALL be restored when that list is opened again. If the browser cannot store it, the switch SHALL still work for the current visit.

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

### Requirement: List View — Animated View Change

Changing the selected view SHALL animate the new content in, and the animation SHALL be skipped when the admin prefers reduced motion.

#### Scenario: Switching animates the items

- **GIVEN** an admin on the apartments list in cards view
- **WHEN** they select `Tabela`
- **THEN** the table fades and rises into place instead of appearing abruptly

#### Scenario: Reduced motion

- **GIVEN** an admin whose system prefers reduced motion
- **WHEN** they switch views
- **THEN** the new view appears immediately without animation

### Requirement: List View — Accessible View Switch

The view switch SHALL be a group of buttons labelled `Kafelki` and `Tabela`, each with an icon, operable by keyboard, with the active option exposed as pressed to assistive technologies. The switch SHALL be rendered by a reusable segmented control that accepts any number of options.

#### Scenario: Active option announced

- **GIVEN** the table view is active
- **WHEN** a screen reader reaches the switch
- **THEN** `Tabela` is reported as pressed and `Kafelki` as not pressed

#### Scenario: Keyboard switching

- **GIVEN** focus is on the `Kafelki` button
- **WHEN** the admin presses Tab to `Tabela` and activates it with Enter or Space
- **THEN** the table view is shown

### Requirement: Table — Sortable Columns

Every table view SHALL sort from a column header click, expose the active sort direction through `aria-sort`, and toggle between ascending and descending when the active header is clicked again. The sort indicator SHALL be visible on the active column. Sorting SHALL be applied by the list request (sort column and direction sent to the API), so the loaded pages are replaced by the first page in the new order and infinite scrolling keeps appending rows in that same order.

#### Scenario: First click sorts ascending

- **GIVEN** the apartments table in the API order
- **WHEN** the admin activates the `Adres` header
- **THEN** the first page is requested with `sort=label&order=asc` and the rows are shown ascending by address with `aria-sort` `ascending`

#### Scenario: Second click reverses the order

- **GIVEN** the rows sorted ascending by address
- **WHEN** the admin activates the `Adres` header again
- **THEN** the first page is requested with `order=desc` and the rows are shown descending with `aria-sort` `descending`

#### Scenario: Switching the sorted column

- **GIVEN** the rows sorted by address
- **WHEN** the admin activates the `Udział` header
- **THEN** the rows are sorted by share ascending and only the `Udział` header reports an active sort

#### Scenario: Sorting replaces the loaded pages

- **GIVEN** a table with several pages loaded
- **WHEN** the admin sorts a column
- **THEN** the current rows stay visible until the first page in the new order arrives, then they are replaced without gaps or duplicates

#### Scenario: Sorting does not replay the view animation

- **GIVEN** the table view is already shown
- **WHEN** the admin sorts a column
- **THEN** the list content updates in place without replaying the view-change animation

#### Scenario: Appended pages keep the order

- **GIVEN** the table sorted descending by address and more rows remain
- **WHEN** scrolling appends the next page
- **THEN** the new rows continue the descending order without gaps or duplicates
