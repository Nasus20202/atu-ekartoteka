# Spec Delta

## ADDED Requirements

### Requirement: Compact User Table

In the table view of the admin users page, users SHALL be shown as table rows under the headers `Użytkownik`, `E-mail`, `Status`, `Mieszkania` and `Akcje`. Each row SHALL show the name (or email when there is no name), the email, the status badge, the number of assigned apartments and the same `Akcje` menu as the card for that status. Registration date and the assigned apartment details SHALL NOT be shown in the table.

#### Scenario: Table content

- **GIVEN** the table view
- **WHEN** an approved user `Anna Nowak` (`anna@example.com`) with 2 assigned apartments is shown
- **THEN** their row shows `Anna Nowak`, `anna@example.com`, the `Zatwierdzony` badge and `2 mieszkania`

#### Scenario: Pending user actions

- **GIVEN** a pending user row
- **WHEN** the admin opens its `Akcje` menu
- **THEN** `Zatwierdź` and `Odrzuć` are offered and behave exactly as on the card

#### Scenario: Approved and rejected user actions

- **GIVEN** an approved or rejected user row
- **WHEN** the admin opens its `Akcje` menu
- **THEN** approved users offer `Mieszkania (N)` and `Zmień status`, and rejected users offer `Zmień status`, behaving exactly as on the card

#### Scenario: Action refreshes the table

- **GIVEN** the table view under the `Oczekujące` filter
- **WHEN** the admin approves a user from its row menu
- **THEN** the loaded pages refresh in place and the user leaves the table, as in cards view

#### Scenario: Infinite scrolling appends table rows

- **GIVEN** the table view is selected and more users remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows

### Requirement: User Table Sorting

The user table SHALL sort by `Użytkownik`, `E-mail`, `Status` and `Mieszkania` from the column headers, with the sort column and direction sent to the users API so every page arrives in that order. Names SHALL fall back to the email and use locale-aware order, status SHALL use the order `Oczekuje`, `Zatwierdzony`, `Odrzucony` and the apartment count SHALL sort numerically.

#### Scenario: Sort by name

- **GIVEN** users `Zed` and `Anna Nowak`
- **WHEN** the admin sorts by `Użytkownik` ascending
- **THEN** `Anna Nowak` comes first

#### Scenario: Sort users without a name

- **GIVEN** a user without a name
- **WHEN** the admin sorts by `Użytkownik`
- **THEN** the user is ordered by their email

#### Scenario: Sort by apartment count

- **GIVEN** users with 2 and 10 assigned apartments
- **WHEN** the admin sorts by `Mieszkania` ascending
- **THEN** the user with 2 apartments comes first

#### Scenario: Sort by status

- **GIVEN** pending, approved and rejected users
- **WHEN** the admin sorts by `Status` ascending
- **THEN** pending users come first, then approved, then rejected
