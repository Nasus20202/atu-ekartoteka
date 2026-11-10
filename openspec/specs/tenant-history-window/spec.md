# tenant-history-window Specification

## Purpose

Limits the charge and payment history visible to tenants to the current calendar year plus a number of previous full years chosen by the admin, while admins keep access to the full history.

## Requirements

### Requirement: Tenant History Window

The system SHALL show tenants only charge periods and payment years from the window's start year onward. The start year is the current calendar year minus the configured number of previous years, so whole calendar years are always shown or hidden together. The system SHALL NOT delete data outside the window.

#### Scenario: Default window shows current and two previous years

- **GIVEN** the setting has its default value of 2 and the current date is in 2027
- **AND** a tenant's apartment has charges and payments for 2023 through 2027
- **WHEN** the tenant views their charges, payments or dashboard
- **THEN** only data for 2025, 2026 and 2027 is shown

#### Scenario: Whole calendar years are kept

- **GIVEN** the setting is 2 and the current date is 2027-01-05
- **WHEN** the tenant views their charges
- **THEN** every month of 2025 is shown, including January through December

#### Scenario: Hidden data remains stored

- **GIVEN** charges and payments older than the window
- **WHEN** a tenant views their history
- **THEN** the older records are not shown but remain in the database unchanged

---

### Requirement: Window Applies to Every Tenant View

The system SHALL apply the history window to the tenant dashboard (balances, balance chart, charge trend), the charges overview and per-apartment charge pages, the payments list, the payment detail page and its year switcher.

#### Scenario: Hidden payment year by URL

- **GIVEN** a tenant and a payment year of their apartment that is older than the window
- **WHEN** they open `/dashboard/payments/<apartmentId>/<hidden year>`
- **THEN** a not-found page is shown

#### Scenario: Hidden month requested in charges

- **GIVEN** a tenant
- **WHEN** they open `/dashboard/charges?month=YYYY-MM` for a month older than the window
- **THEN** the month is not shown and the page renders the visible years with default expansion

#### Scenario: Year switcher lists visible years only

- **GIVEN** an apartment with stored payment years 2023 through 2027 and a window start year of 2025
- **WHEN** the tenant views a payment detail page
- **THEN** the `Rok` select lists only 2027, 2026 and 2025

#### Scenario: Dashboard balance uses visible years

- **GIVEN** a tenant whose apartment has payment years outside the window
- **WHEN** they view the dashboard `Saldo wpłat` card
- **THEN** the balance chart history contains only months from visible years

#### Scenario: Current charge notices unaffected

- **GIVEN** current charge notifications for a tenant's apartment
- **WHEN** the tenant views the dashboard
- **THEN** the `Powiadomienia` card shows them regardless of the window

#### Scenario: Previous month outside the window

- **GIVEN** the setting is 0 and the current date is 2027-01-10
- **AND** the tenant's apartment has charges for December 2026 and January 2027
- **WHEN** the tenant views the dashboard `Naliczenia` card
- **THEN** only the January 2027 tile is shown, with no December 2026 tile, no previous-month amount and no December point in the charge trend

### Requirement: Admin Views Ignore the Window

The system SHALL NOT apply the tenant history window to any admin view or admin API.

#### Scenario: Admin sees full history

- **GIVEN** an apartment with payment years 2023 through 2027 and a window start year of 2025
- **WHEN** an admin opens the apartment detail page
- **THEN** the charges and payments for all years 2023 through 2027 are listed

#### Scenario: Admin viewing tenant panel

- **GIVEN** an admin with assigned apartments who opens the tenant panel (`/dashboard`)
- **WHEN** the pages render
- **THEN** the window is applied as for any tenant, because the tenant panel always shows the tenant view

---

### Requirement: Admin-Configurable Window Length

The system SHALL let an admin set, on the `Ustawienia` page at `/admin/settings`, the number of previous full calendar years visible to tenants. The value SHALL be a whole number from 0 to 20 and SHALL default to 2 when it has never been set. The page SHALL load the stored value, and saving SHALL go through an admin-only Server Action.

#### Scenario: Admin views the current setting

- **GIVEN** an authenticated admin
- **WHEN** they open `/admin/settings`
- **THEN** a select labelled `Liczba poprzednich lat widocznych dla mieszkańców` shows the current value (e.g. `2 lata`), offering every whole number from 0 to 20
- **AND** a hint explains which years tenants currently see (e.g. `Mieszkańcy widzą lata 2025–2027`)

#### Scenario: Admin saves a new value

- **GIVEN** an admin on the settings page
- **WHEN** they choose `1 rok` and click `Zapisz`
- **THEN** the value is stored, a success alert `Zapisano ustawienia` is shown
- **AND** subsequent tenant page loads use the new window

#### Scenario: Invalid value rejected

- **GIVEN** an authenticated admin
- **WHEN** the save action receives a value that is negative, above 20 or not a whole number, or an unknown setting
- **THEN** it returns an invalid result and nothing is stored

#### Scenario: Malformed request body rejected

- **GIVEN** an authenticated admin
- **WHEN** the save action receives input that is not an object of settings
- **THEN** it returns an invalid result and nothing is stored

#### Scenario: Default when never configured

- **GIVEN** no stored setting
- **WHEN** a tenant page or the settings page loads
- **THEN** the value 2 is used

#### Scenario: Non-admin cannot change setting

- **GIVEN** an unauthenticated user or a tenant
- **WHEN** they invoke the save action
- **THEN** it returns an unauthenticated or forbidden result and nothing is stored

#### Scenario: Settings in admin navigation

- **GIVEN** an authenticated admin in the admin panel
- **WHEN** the navigation renders
- **THEN** it contains an `Ustawienia` link to `/admin/settings`

### Requirement: Settings Stored as One Validated Row

The system SHALL store all application settings in a single database row with one typed column per setting. A setting MAY be unset (null) when its meaning is "not configured". The database SHALL reject a second row and any value outside a setting's allowed range or length, independently of application validation.

#### Scenario: Only one settings row can exist

- **WHEN** a second settings row is inserted
- **THEN** the database rejects it

#### Scenario: Out-of-range value rejected by the database

- **WHEN** a write sets the history window to a value below 0 or above 20
- **THEN** the database rejects it and the stored value is unchanged

#### Scenario: First save creates the row

- **GIVEN** no settings row exists
- **WHEN** an admin saves a valid value
- **THEN** the single settings row is created with that value

#### Scenario: Unset text setting

- **GIVEN** a settings row that has never had a privacy policy saved
- **WHEN** the privacy policy setting is read
- **THEN** it is null, not an empty string

#### Scenario: Over-long text rejected by the database

- **WHEN** a write sets the privacy policy to more than 50 000 characters
- **THEN** the database rejects it and the stored value is unchanged

### Requirement: Settings Migration Preserves the Stored Value

The migration that introduces the single settings row SHALL work on a database with no stored setting and on one that already has the history window stored, and SHALL leave exactly one settings row either way.

#### Scenario: Existing valid value is kept

- **GIVEN** a database whose old settings table stores a history window of 5
- **WHEN** the migration runs
- **THEN** the settings row holds 5 and the old table is removed

#### Scenario: No stored setting uses the default

- **GIVEN** a database whose old settings table is empty
- **WHEN** the migration runs
- **THEN** the settings row holds the default of 2

#### Scenario: Invalid stored value uses the default

- **GIVEN** an old stored history window that is not a whole number from 0 to 20
- **WHEN** the migration runs
- **THEN** the settings row holds the default of 2 and the migration does not fail

### Requirement: Settings Loaded Once Per Request

The system SHALL read each setting through its own reader that loads only that setting's column, at most once per request however many components need it. Reading one setting SHALL NOT load any other, and a save SHALL read and return only the settings it changes.

#### Scenario: Several consumers in one render

- **GIVEN** a page whose layout and sections each need the history window
- **WHEN** a tenant loads the page
- **THEN** the history window is queried once

#### Scenario: Next request reads fresh values

- **GIVEN** an admin changed the setting
- **WHEN** the next request loads
- **THEN** it reads the stored value, not a value from an earlier request

#### Scenario: Other settings are not loaded

- **GIVEN** a tenant page that needs only the history window
- **WHEN** it renders
- **THEN** the query selects only the history window column and does not load the privacy policy text

#### Scenario: Saving one setting leaves the others untouched

- **GIVEN** a saved privacy policy
- **WHEN** an admin saves a new history window
- **THEN** the save does not read or return the policy text and the stored policy is unchanged

#### Scenario: Missing row yields defaults

- **GIVEN** no settings row exists
- **WHEN** a setting is read
- **THEN** its default is returned: 2 for the history window and null for the privacy policy
