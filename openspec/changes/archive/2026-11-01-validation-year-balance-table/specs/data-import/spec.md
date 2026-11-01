## MODIFIED Requirements

### Requirement: On-Demand Database Validation

The system SHALL let an administrator run, from the import page, the import validation checks (line totals, payment balance identity, calculated versus imported monthly charges, year-to-year balance drift) against the data already stored in the database, without importing files and without modifying data. Validation SHALL process HOAs with the same bounded concurrency as the import. Results SHALL be reported per HOA in the same warning and error format and download options as an import result. A result banner and the year balance table SHALL be shown above those results. The admin SHALL be able to skip the full validation with the checkbox "Pomiń pełną walidację"; when it is checked, only the year balances SHALL be loaded and checked, and no file checks, cross-year checks or drift checks run.

#### Scenario: Validation of stored data

- **GIVEN** an admin on the import page
- **WHEN** they trigger database validation
- **THEN** the checks run for every HOA, and the result banner, the year balance table and a per-HOA result with warnings and errors are displayed in that order

#### Scenario: Clean database

- **GIVEN** stored data with no inconsistencies
- **WHEN** validation runs
- **THEN** the success banner, the year balance table and a message that no warnings or errors were found are shown

#### Scenario: Bounded concurrency

- **WHEN** validation runs for several HOAs
- **THEN** no more than the import's HOA concurrency limit are validated at the same time, and the results are returned in HOA order

#### Scenario: Full validation skipped

- **GIVEN** an admin who checks "Pomiń pełną walidację" on the import page
- **WHEN** they trigger database validation
- **THEN** only the year balances are loaded, the year balance table is shown with the mismatch markers, and the banner states that the full validation was skipped and the number of balance mismatches

#### Scenario: Data not modified

- **WHEN** validation runs
- **THEN** no record is created, changed or deleted

#### Scenario: Admin only

- **WHEN** a non-admin calls the validation endpoint
- **THEN** the request is rejected as unauthorized

## ADDED Requirements

### Requirement: Validation Result Banner

The system SHALL show a result banner at the top of the validation result. The banner SHALL be green only when there are no errors, no warnings and no closing balance mismatches. When there are warnings or mismatches but no errors, it SHALL state the number of warnings and mismatches and SHALL NOT say that validation passed. When any HOA has an error, it SHALL show a failure alert. The banner SHALL state its result in text, not only in colour.

#### Scenario: Passed without findings

- **GIVEN** stored data with no warnings, errors or mismatches
- **WHEN** validation runs
- **THEN** the success banner states that validation completed without errors or warnings

#### Scenario: Warnings present

- **GIVEN** stored data with warnings but no errors
- **WHEN** validation runs
- **THEN** a warning banner states the number of warnings and mismatches and does not state that validation passed

#### Scenario: Failed with errors

- **GIVEN** an HOA with at least one error
- **WHEN** validation runs
- **THEN** a failure alert is shown with the number of errors and the number of HOAs with errors

### Requirement: Year Status

The system SHALL give each HOA and year a status: `error` when the year has an error, `warning` when the year has at least one issue, and `ok` otherwise. An error or warning that names a year belongs to that year; one without a year applies to every year of the HOA. A closing balance mismatch counts against the year it closes and the year it opens.

#### Scenario: Year with a warning

- **GIVEN** a warning for the 2025 opening balance of an HOA
- **WHEN** validation runs
- **THEN** the 2025 status is `warning` and the 2024 status is not changed by it

#### Scenario: Year with no issues

- **GIVEN** an HOA year with no warnings, errors or mismatches
- **WHEN** validation runs
- **THEN** its status is `ok`

#### Scenario: Error for one year

- **GIVEN** a payment whose closing balance fails the balance identity for 2025
- **WHEN** validation runs
- **THEN** the 2025 status is `error` and the other years are not changed by it

#### Scenario: Skipped validation shows the balance status

- **GIVEN** the full validation was skipped
- **WHEN** validation runs
- **THEN** the banner states that the full validation was skipped, and shows the balances as consistent when there are no balance mismatches, or as a warning with the number of mismatches otherwise; it never states that validation passed

#### Scenario: HOA error without a year

- **GIVEN** an HOA with an error that names no year
- **WHEN** validation runs
- **THEN** every year of that HOA has status `error`

### Requirement: Validation Badges

The admin page SHALL show an OK badge next to an HOA name when none of its values is red, and next to a year name when no HOA has a red value in that year; otherwise the badge SHALL read as an error. Warnings SHALL NOT make a badge or a value red.

#### Scenario: Warning-only HOA

- **GIVEN** an HOA whose only findings are warnings
- **WHEN** validation runs
- **THEN** its badge reads OK and its values are not red

### Requirement: Year Balance Details

The admin page SHALL show the apartment records of an HOA year when a balance value is clicked, mismatched records first, with mismatches in red and new owner records in yellow. The panel SHALL stay open until closed and SHALL scroll when it has more records than fit. The opening cell of a year SHALL state the new owner balance when it is not zero.

#### Scenario: Balance values look clickable

- **WHEN** the admin points at a balance value
- **THEN** the value shows a pointer cursor and a background change

#### Scenario: Records of a year on click

- **GIVEN** an HOA year with apartment records
- **WHEN** an admin clicks one of its balance values
- **THEN** a panel lists those records with the mismatched records first

#### Scenario: New owner record highlighted

- **GIVEN** an HOA year with a record of a new owner that does not mismatch
- **WHEN** the admin opens the records of that year
- **THEN** that record's row is highlighted in yellow and is not shown in red

#### Scenario: Records scroll

- **GIVEN** an HOA year with more records than fit in the panel
- **WHEN** the panel is open
- **THEN** the records can be scrolled inside the panel and its header stays visible

#### Scenario: Panel closes

- **GIVEN** an open records panel
- **WHEN** the admin presses Escape or clicks outside the panel
- **THEN** the panel closes

#### Scenario: New owner in the opening cell

- **GIVEN** an HOA year whose opening total includes a record that does not exist in the previous year
- **WHEN** validation runs
- **THEN** the opening cell states the amount of that record as a new owner balance

### Requirement: Year Balance Overview Table

The system SHALL, for each HOA and each year stored for it, return the opening balance loaded from the files and the calculated closing balance, summed over the HOA's apartments, the closing balance being derived from charge records as in Derived Balance Drift Warning. The admin validation page SHALL show them as a grid with one row per HOA, named by its name rather than its identifier.

#### Scenario: Closing next to the following opening

- **GIVEN** stored payments for 2024 and 2025 for an HOA
- **WHEN** validation runs
- **THEN** each year shows its closing column followed by its opening column, and the 2025 closing sits next to the 2026 opening when the years are shown newest first

#### Scenario: Cells of a year with an error

- **GIVEN** a year of an HOA with status `error`
- **WHEN** validation runs
- **THEN** that year's opening and closing cells are shown in red

#### Scenario: Newest year first

- **GIVEN** stored payments for 2024 and 2025 for an HOA
- **WHEN** validation runs
- **THEN** the 2025 columns come before the 2024 columns

#### Scenario: Many years scroll sideways

- **GIVEN** stored payments for many years of an HOA, so the grid is wider than the screen
- **WHEN** the admin scrolls the grid sideways
- **THEN** the HOA name column stays visible on the left, and its right edge stays visible while the year columns scroll under it

#### Scenario: Years without payments

- **GIVEN** an HOA with no stored payments for a year
- **WHEN** validation runs
- **THEN** that year's cells for the HOA are empty

### Requirement: Year Balance Mismatch Marker

A calculated closing balance SHALL be marked as mismatching when the next stored year of the same HOA differs from it by more than ±0.01, comparing only the apartments that have both years. The mismatching closing balance SHALL be shown in red with a text marker and the next year's opening balance, and the page SHALL explain in text what the red means. The last stored year of an HOA has no next year and SHALL NOT be marked.

#### Scenario: Owner change

- **GIVEN** a flat whose owner changed, so the import holds a separate record for the new owner with its own opening balance
- **WHEN** validation runs
- **THEN** the new owner's record is not compared with the previous owner's record, and the change of owner is not reported as an error

#### Scenario: Matching balance between years

- **GIVEN** the calculated closing balance of 2024 equals the loaded opening balance of 2025 within ±0.01
- **WHEN** validation runs
- **THEN** the 2024 closing balance is not marked

#### Scenario: Mismatch with the next year is red

- **GIVEN** the calculated closing balance of 2024 differs from the loaded opening balance of 2025 by more than ±0.01
- **WHEN** validation runs
- **THEN** the 2024 closing balance is shown in red with a text marker and the 2025 opening balance

#### Scenario: Last stored year is not marked

- **GIVEN** the latest stored year of an HOA
- **WHEN** validation runs
- **THEN** its closing balance is shown without a mismatch marker, even when it differs from any opening balance

#### Scenario: Table shown without findings

- **GIVEN** stored data with no warnings or errors
- **WHEN** validation runs
- **THEN** the table is still shown
