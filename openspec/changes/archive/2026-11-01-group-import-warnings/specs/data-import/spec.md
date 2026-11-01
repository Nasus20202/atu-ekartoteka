# Spec Delta

## ADDED Requirements

### Requirement: Import Warning Grouping

Each import warning SHALL carry a kind from a fixed set: `line-total`, `charges-mismatch`, `opening-balance-file`, `opening-balance-calculated` or `skipped-records`. The import result card SHALL group the warnings by kind under a heading that shows the kind's title and the number of warnings, with a one-sentence description. Groups SHALL appear in the order charges-mismatch, opening-balance-file, opening-balance-calculated, line-total, skipped-records. Groups without warnings SHALL NOT be shown.

#### Scenario: Warnings grouped by kind

- **GIVEN** an import whose result has a `line-total` warning and a `skipped-records` warning, in that order
- **WHEN** the admin views the import result card
- **THEN** the card shows a heading with the title and count for each kind, the `line-total` group above the `skipped-records` group

#### Scenario: Empty groups hidden

- **GIVEN** an import whose warnings all have the kind `charges-mismatch`
- **WHEN** the admin views the import result card
- **THEN** only the charges-mismatch group is shown

#### Scenario: Order kept within a group

- **GIVEN** two `line-total` warnings for apartments A and B, produced in that order
- **WHEN** the admin views the import result card
- **THEN** the two warnings are listed under the line-total heading in the order A, then B

## MODIFIED Requirements

### Requirement: Naliczenia Import Validation Severity

The system SHALL validate each entry in `nal_czynsz.txt` before committing to the database. The Wplaty closing-balance check SHALL abort the HOA import on failure. The cross-file charge check SHALL compare charges per owner, apartment and billing period against the monthly charges imported from `wplaty.txt`; because those imported columns are known to be unreliable and are no longer used for display, a mismatch SHALL be reported as a warning and SHALL NOT abort the import. Each such warning SHALL state that the field from the files is ignored by the application. Mismatches SHALL be rolled up into one warning per owner, apartment and year that lists each differing month with both values, and states when a month's difference equals the sum of its `Wyrównanie` lines; otherwise it states the unexplained difference. The line-total identity check (`totalAmount ≈ quantity × unitPrice`) SHALL be reported as a warning only and SHALL NOT abort the import.

#### Scenario: Line total mismatch reported as warning, import continues

- **GIVEN** a `nal_czynsz.txt` entry where `totalAmount` does not equal `quantity × unitPrice` within ±0.01
- **WHEN** import validation runs
- **THEN** a warning is recorded in the per-HOA result identifying the offending line and the difference
- **AND** the import continues using the file-provided `totalAmount` as the persisted value
- **AND** no error is recorded for that case

#### Scenario: Valid line totals produce no warning

- **GIVEN** all entries in `nal_czynsz.txt` have consistent totals
- **WHEN** import validation runs
- **THEN** no warnings are recorded for line totals and the import proceeds normally

#### Scenario: Cross-file charge sum mismatch reported as warning

- **GIVEN** the per-period sum of `nal_czynsz.totalAmount` for an owner and apartment differs from the same owner's `wplaty` monthly charge for that apartment by more than the cross-file tolerance
- **WHEN** import validation runs
- **THEN** a single warning is recorded for that owner, apartment and year listing each differing period with both values
- **AND** the import continues and the imported monthly charge is stored in the legacy column unchanged

#### Scenario: Owner change with former-owner row without charges passes

- **GIVEN** an apartment whose `wplaty.txt` contains a row for the former owner with zero monthly charges and a row for the current owner
- **AND** `nal_czynsz.txt` contains charges for that apartment only under the current owner, matching the current owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file warning is recorded for that apartment and the import proceeds

#### Scenario: Mid-year owner change with charges under both owners passes

- **GIVEN** an apartment where both the former and the current owner have non-zero monthly charges in `wplaty.txt` for the same year
- **AND** each owner's `nal_czynsz.txt` entries match that owner's monthly charges
- **WHEN** import validation runs
- **THEN** no cross-file warning is recorded for that apartment

#### Scenario: Charges of another owner do not count

- **GIVEN** a `wplaty` row with non-zero monthly charges for an owner and apartment
- **AND** `nal_czynsz.txt` contains charges for that apartment and period only under a different owner
- **WHEN** import validation runs
- **THEN** a cross-file warning is recorded for that owner's row and the import continues

#### Scenario: Mismatch caused by settlement lines is identified

- **GIVEN** a month where the `nal_czynsz.txt` sum exceeds or falls short of the `wplaty` charge by exactly the sum of that month's `Wyrównanie` lines
- **WHEN** import validation runs
- **THEN** the warning states that the difference equals the settlement lines

#### Scenario: Unexplained difference stated

- **GIVEN** a month where the `nal_czynsz.txt` sum differs from the `wplaty` charge and the difference is not equal to the sum of that month's `Wyrównanie` lines
- **WHEN** import validation runs
- **THEN** the warning states the unexplained difference in brackets after the two values

#### Scenario: Import result UI surfaces warnings

- **GIVEN** an import that produced one or more warnings
- **WHEN** the admin views the import result card
- **THEN** the card shows an `Ostrzeżenia` section listing each warning with its apartment and message
- **AND** period, line and line-total difference are shown for warnings that carry them

---
