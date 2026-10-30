## MODIFIED Requirements

### Requirement: Batch File Import

The system SHALL allow admins to upload a collection of legacy files and process them as a batch, grouping files by HOA. A `.txt` file SHALL be recognised by its name prefix (`lok`, `nal_czynsz`, `pow_czynsz`, `wplaty`), ignoring letter case, so suffixed names such as `wplaty_2026.txt` are accepted. Several files of one kind in one HOA folder SHALL be merged, and a record present in more than one of them SHALL stop the HOA import with an error naming both files, even when validation is skipped.

#### Scenario: Successful batch import

- **GIVEN** an authenticated admin
- **WHEN** they upload a set of files covering one or more HOAs
- **THEN** files are grouped by HOA identifier, each HOA is processed independently, and a summary of created/updated/errored records is returned for each HOA

#### Scenario: Suffixed TXT file names

- **GIVEN** an HOA folder containing `wplaty_2026.txt` and `nal_czynsztest.txt`
- **WHEN** the admin imports the folder
- **THEN** the files are imported as payments and charges respectively

#### Scenario: Several files of the same kind are merged

- **GIVEN** an HOA folder containing `wplaty1.txt` with payments for 2025 and `wplaty2.txt` with payments for 2026
- **WHEN** the admin imports the folder
- **THEN** payments from both files are validated and imported together

#### Scenario: Record repeated across files

- **GIVEN** an HOA folder where `wplaty1.txt` and `wplaty2.txt` both contain the 2025 payment row of owner `W001`, apartment `A1`
- **WHEN** the admin imports the folder, with or without skipping validation
- **THEN** the HOA import stops before any data is written and reports `Zduplikowane rekordy w plikach wplaty1.txt i wplaty2.txt (1): W001#A1|2025`

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
