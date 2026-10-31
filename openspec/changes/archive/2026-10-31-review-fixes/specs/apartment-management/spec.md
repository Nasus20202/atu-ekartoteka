## MODIFIED Requirements

### Requirement: Apartment Table Sorting

The apartment table SHALL sort by `Adres`, `Właściciel`, `Udział` and `Status` from the column headers, with the sort column and direction sent to the apartments API so every page arrives in that order. Address and owner SHALL use locale-aware alphanumeric order, share SHALL sort by its ratio (numerator divided by denominator), and apartments with an unknown share SHALL come last when sorting ascending. Status SHALL group active apartments before inactive ones when sorting ascending.

#### Scenario: Sort by address

- **GIVEN** apartments `ul. Przewijana 1/2` and `ul. Przewijana 1/10`
- **WHEN** the admin sorts by `Adres` ascending
- **THEN** `ul. Przewijana 1/2` comes before `ul. Przewijana 1/10`

#### Scenario: Sort by share value

- **GIVEN** apartments with shares 20% and 1,22%
- **WHEN** the admin sorts by `Udział` ascending
- **THEN** the 1,22% apartment comes first

#### Scenario: Shares with different denominators

- **GIVEN** apartments with shares 1/2 (50%) and 30/100 (30%)
- **WHEN** the admin sorts by `Udział` ascending
- **THEN** the 30% apartment comes first

#### Scenario: Unknown share

- **GIVEN** an apartment without a share, or with a zero denominator, and apartments with shares
- **WHEN** the admin sorts by `Udział` ascending
- **THEN** the apartment without a share is last

#### Scenario: Status order

- **GIVEN** active and inactive apartments
- **WHEN** the admin sorts by `Status` ascending
- **THEN** active apartments are listed before inactive ones

### Requirement: Apartment Ownership Share

The system SHALL store the ownership share (numerator/denominator) of each apartment within its HOA. The database SHALL derive the share ratio (numerator divided by denominator, unknown when the denominator is missing or zero) and every view SHALL display that stored ratio instead of computing it.

#### Scenario: Share stored on import

- **GIVEN** apartment data imported from a legacy file
- **WHEN** the file contains share numerator and denominator values
- **THEN** these values are persisted on the apartment record

#### Scenario: Displayed share comes from the database

- **GIVEN** an apartment with numerator 1 and denominator 2
- **WHEN** any admin or tenant view shows its share
- **THEN** the percentage is formatted from the stored ratio 0.5 as `50%`

#### Scenario: Inactive apartments remain visible

- **GIVEN** an apartment that was present in a previous import but not in the latest file
- **WHEN** an admin lists apartments without `activeOnly=true`
- **THEN** the apartment appears in results with `isActive: false`

### Requirement: Compact Apartment Table

In the table view of the HOA apartments page, apartments SHALL be shown as table rows under the headers `Adres`, `Właściciel`, `Udział` and `Status`. Each row SHALL show the label, owner, share percentage (or `-` when unknown) and status, with the same inactive and duplicate markers as the cards. Activating the address link SHALL open the apartment details page; the row SHALL NOT show external IDs or postal code/city.

#### Scenario: Table content

- **GIVEN** the table view on a HOA's apartments
- **WHEN** an active apartment `ul. Przytulna 22 A/4` owned by `Ślesiccy Teresa i Jerzy D` with share 1,22% is shown
- **THEN** its row shows `ul. Przytulna 22 A/4`, `Ślesiccy Teresa i Jerzy D`, `1,22%` and `Aktywne` under the matching headers

#### Scenario: Row opens details

- **GIVEN** the table view
- **WHEN** the admin clicks the address of an apartment
- **THEN** the apartment details page opens

#### Scenario: Inactive and duplicate markers

- **GIVEN** an inactive apartment and two active apartments sharing an address are loaded
- **WHEN** the table view is shown
- **THEN** the inactive row is muted with `Nieaktywne` and both duplicate rows show `Duplikat adresu`

#### Scenario: Narrow screens

- **GIVEN** a 390 px wide screen
- **WHEN** the table view is shown
- **THEN** the table scrolls inside its own container and the page does not scroll horizontally

#### Scenario: Infinite scrolling appends table rows

- **GIVEN** the table view is selected and more apartments remain
- **WHEN** the admin scrolls to the end of the list
- **THEN** the next page is appended as table rows
