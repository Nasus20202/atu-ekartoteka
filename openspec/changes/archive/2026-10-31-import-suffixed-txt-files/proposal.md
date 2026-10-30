# Proposal

## Why

Admins keep several exports side by side and name them with a suffix, e.g. `wplaty_2026.txt` or `nal_czynsztest.txt`, and sometimes split one kind of data into several files (`wplaty1.txt`, `wplaty2.txt`). The import accepts only the exact names (`lok.txt`, `nal_czynsz.txt`, `pow_czynsz.txt`, `wplaty.txt`) and rejects the rest as unknown files, so the files have to be renamed and joined by hand before every import.

## What Changes

- A `.txt` file is routed by its name prefix: `lok*`, `nal_czynsz*`, `pow_czynsz*`, `wplaty*`. Matching ignores letter case.
- Several files of the same kind in one HOA folder are merged into one data set before validation and import.
- A record found in more than one of those files (same owner, apartment and year for payments; same owner, apartment, period and line for charges; same owner, apartment and line for notifications; same owner and apartment for apartments) is an error that stops the HOA import, even when validation is skipped. The error names both files, the number of repeated records and up to five of their keys.
- Notification header and footer are taken from the first file that has them.
- WMB routing is unchanged.

## Capabilities

### Modified Capabilities

- `data-import`: batch import accepts suffixed TXT file names and merges several files of one kind.
