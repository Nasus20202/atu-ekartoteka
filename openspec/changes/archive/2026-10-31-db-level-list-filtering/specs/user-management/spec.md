## ADDED Requirements

### Requirement: Database-Filtered Admin User Data

The apartment assignment dialog SHALL list only apartments the database reports as free or held by the edited user, filtered by the dialog search on the server. The pending-accounts header on the users page SHALL show the number of pending tenant accounts counted by the database, independent of the loaded rows and the active filter.

#### Scenario: Apartment held by another user is not offered

- **GIVEN** more than 200 users, one of them holding apartment `A1`
- **WHEN** an admin opens the assignment dialog for a different user
- **THEN** `A1` is not listed

#### Scenario: Dialog search by full label

- **WHEN** the admin types `ul. Testowa 1/2B` in the dialog search
- **THEN** the apartment with address `ul. Testowa`, building `1` and number `2B` is listed

#### Scenario: Pending count with another filter

- **GIVEN** 3 pending tenant accounts
- **WHEN** the admin shows the `Zatwierdzone` filter
- **THEN** the header still reads `3 konta oczekują na zatwierdzenie`
