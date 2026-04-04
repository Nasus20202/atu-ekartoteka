# Capability: Data Import

## Purpose

Allows admins to import apartment, charge, payment, and charge notification data from legacy HOA system files (`.txt` / `.wmb` format), supporting batch processing across multiple HOAs in a single operation.

## Requirements

### Requirement: Batch File Import

The system SHALL allow admins to upload a collection of legacy files and process them as a batch, grouping files by HOA.

#### Scenario: Successful batch import

- **GIVEN** an authenticated admin
- **WHEN** they upload a set of files covering one or more HOAs
- **THEN** files are grouped by HOA identifier, each HOA is processed independently, and a summary of created/updated/errored records is returned for each HOA

#### Scenario: Multipart and JSON (base64) upload formats

- **GIVEN** an admin uploading files
- **WHEN** files are submitted as `multipart/form-data`
- **THEN** files are read directly from form data
- **WHEN** files are submitted as `application/json` with base64 gzip-compressed content
- **THEN** files are decompressed and processed identically to the multipart path

#### Scenario: Admin-only access

- **GIVEN** a non-admin user
- **WHEN** they attempt to call the import endpoint
- **THEN** the request is rejected with 401

#### Scenario: No files provided

- **GIVEN** an admin submitting an import request
- **WHEN** the request contains no files
- **THEN** the request is rejected with an appropriate error

---

### Requirement: Apartment Import

The system SHALL parse apartment records from a LOK-format file and upsert them into the database.

#### Scenario: Create new apartment

- **GIVEN** an apartment in the import file that does not exist in the database
- **WHEN** import runs
- **THEN** the apartment is created with all fields (owner, address, building, number, postal code, city, share numerator/denominator, external IDs)

#### Scenario: Update existing apartment

- **GIVEN** an apartment already in the database (matched by `externalOwnerId` + `externalApartmentId`)
- **WHEN** import runs with updated data
- **THEN** the apartment's fields are updated to match the file

#### Scenario: Mark inactive apartments

- **GIVEN** apartments previously imported for a HOA that are absent from the current file
- **WHEN** import runs
- **THEN** those apartments are marked as `isActive: false`

#### Scenario: Respect existing owner assignment

- **GIVEN** an apartment already assigned to a tenant user
- **WHEN** import runs
- **THEN** the `userId` assignment is preserved (not overwritten by import)

---

### Requirement: Charge Import

The system SHALL parse charge records from a NAL-CZYNSZ format file and upsert them per apartment and billing period.

#### Scenario: Import new charges

- **GIVEN** charge entries in the import file for an apartment and period
- **WHEN** import runs
- **THEN** charge records are created with description, quantity, unit, unit price, total amount, and billing period

#### Scenario: Upsert on re-import

- **GIVEN** charges already existing for an apartment and billing period
- **WHEN** the same file is imported again (non-clean mode)
- **THEN** existing records are updated rather than duplicated (matched by `apartmentId` + `period` + `externalLineNo`)

---

### Requirement: Payment Import

The system SHALL parse payment records from a WPLATY format file and upsert them per apartment and year.

#### Scenario: Import new payments

- **GIVEN** payment entries in the import file
- **WHEN** import runs
- **THEN** payment records are created with opening/closing balances and monthly payment and charge columns for all 12 months

#### Scenario: Upsert on re-import

- **GIVEN** a payment record already existing for an apartment and year
- **WHEN** the same file is imported again
- **THEN** the record is updated rather than duplicated

#### Scenario: Parse charges from payment files

- **GIVEN** a payment file that also contains charge data
- **WHEN** import runs
- **THEN** monthly charge columns are populated alongside monthly payment columns

---

### Requirement: Charge Notification Import

The system SHALL parse charge notification entries from a POW-CZYNSZ format file and upsert them per apartment.

#### Scenario: Import notifications

- **GIVEN** notification entries in the import file
- **WHEN** import runs
- **THEN** `ChargeNotification` records are created with description, quantity, unit, unit price, and total amount

---

### Requirement: Clean Import Mode

The system SHALL support a clean import mode that deletes existing charges, notifications, and payments for a HOA before inserting new data.

#### Scenario: Clean import clears existing data

- **GIVEN** an admin who sets `cleanImport: true`
- **WHEN** import runs for a HOA
- **THEN** all existing charges, charge notifications, and payments for apartments in that HOA are deleted before new data is inserted

#### Scenario: Standard (non-clean) import preserves existing data

- **GIVEN** an admin who does not set `cleanImport`
- **WHEN** import runs
- **THEN** existing records are upserted and no deletions occur before processing

---

### Requirement: Transactional Consistency

The system SHALL process all database operations for a single HOA within a single database transaction.

#### Scenario: Rollback on failure

- **GIVEN** an import that encounters a critical error mid-processing for a HOA
- **WHEN** the transaction fails
- **THEN** no partial data for that HOA is committed and the error is included in the import result

#### Scenario: Parallel HOA processing

- **GIVEN** files for multiple HOAs in a single import request
- **WHEN** import runs
- **THEN** all HOAs are processed in parallel, and failures in one HOA do not affect others

---

### Requirement: Import Statistics

The system SHALL return statistics for each HOA import showing totals and counts of created, updated, and errored records.

#### Scenario: Stats per entity type

- **GIVEN** a completed import
- **WHEN** the response is returned
- **THEN** it includes per-HOA statistics for apartments, charges, notifications, and payments (total, created, updated, errors)
