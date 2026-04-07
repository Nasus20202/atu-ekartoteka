## ADDED Requirements

### Requirement: WMB Files Per Data Type

The system SHALL track each `.wmb` file by its associated data type and store the data-as-of date per type on the HOA record.

#### Scenario: WMB files routed by filename

- **GIVEN** an import containing `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, and `pow_czynsz_ost_wys.wmb`
- **WHEN** files are grouped by HOA
- **THEN** each file is associated with its data type (apartments, charges, notifications respectively)

#### Scenario: Data date stored per type on HOA

- **GIVEN** a WMB file containing a `YYYYMMDD` date on its first line
- **WHEN** import completes for that HOA
- **THEN** the corresponding `DateTime` field (`apartmentsDataDate`, `chargesDataDate`, or `notificationsDataDate`) is updated on the HOA record

#### Scenario: Missing or unparseable WMB date stored as null

- **GIVEN** a WMB file with missing or malformed date content
- **WHEN** import runs
- **THEN** the corresponding date field on the HOA remains `null` and the import does not fail

#### Scenario: Data dates shown in import result UI

- **GIVEN** a completed HOA import where WMB dates were parsed
- **WHEN** the admin views the import result card for that HOA
- **THEN** each entity type (apartments, charges, notifications) shows its data-as-of date

---

### Requirement: HOA Header and Footer Saved on Notification Import

The system SHALL parse the header and footer from `pow_czynsz.txt` and persist them to the HOA record during notification import, overwriting previous values.

#### Scenario: Header and footer saved on first import

- **GIVEN** a `pow_czynsz.txt` file with text before the first `#` separator (header) and between the first and second `#` separator (footer)
- **WHEN** notification import completes
- **THEN** the HOA record's `header` and `footer` fields are set to the parsed values

#### Scenario: Header and footer updated on reimport

- **GIVEN** a HOA with existing `header` and `footer` values
- **WHEN** a new `pow_czynsz.txt` is imported with different content
- **THEN** the HOA's `header` and `footer` are overwritten with the new values

#### Scenario: Empty header or footer stored as null

- **GIVEN** a `pow_czynsz.txt` with no text before the first `#` separator
- **WHEN** notification import completes
- **THEN** the HOA `header` field is set to `null`

---

### Requirement: Charge Notification Parser Precision

The system SHALL parse all numeric fields in `pow_czynsz.txt` using the correct decimal separator, preserving full float precision.

#### Scenario: Quantity parsed as float

- **GIVEN** a notification line with `quantity` value in Polish locale format (e.g. `45,89`)
- **WHEN** the file is parsed
- **THEN** the `quantity` field is stored as `45.89`, not `45`

#### Scenario: Unit price parsed as float

- **GIVEN** a notification line with `unitPrice` in Polish locale format (e.g. `1,2300`)
- **WHEN** the file is parsed
- **THEN** the `unitPrice` field is stored as `1.23`, not `1`

#### Scenario: Existing records corrected on reimport

- **GIVEN** a `ChargeNotification` record with truncated integer values from a previous import
- **WHEN** the same HOA's `pow_czynsz.txt` is reimported
- **THEN** `hasNotificationChanged` detects the difference and the record is updated with correct float values

---

### Requirement: Naliczenia Import Validation

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database, and abort the HOA import if any validation error is found.

#### Scenario: Line total validation

- **GIVEN** a `nal_czynsz.txt` entry where `totalAmount` does not equal `quantity × unitPrice` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid entries pass validation

- **GIVEN** all entries in `nal_czynsz.txt` have consistent totals
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally

---

### Requirement: Payment Import Validation

The system SHALL validate the closing balance of each entry in `wplaty.txt` before committing, and abort the HOA import if any entry fails.

#### Scenario: Closing balance identity check

- **GIVEN** a `wplaty.txt` entry where `closingBalance` does not equal `openingBalance + totalPayments − totalCharges` within ±0.01
- **WHEN** import validation runs
- **THEN** an error is recorded for that HOA and the import is aborted without writing to the database

#### Scenario: Valid closing balance passes

- **GIVEN** all entries in `wplaty.txt` satisfy the balance identity
- **WHEN** import validation runs
- **THEN** no validation errors are recorded and the import proceeds normally
