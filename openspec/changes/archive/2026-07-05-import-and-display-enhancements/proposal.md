## Why

The import and display system for homeowner association data has several usability gaps that create confusion and data integrity risks. Users need better precision, clearer error handling, smarter duplicate detection, and more consistent balance presentation.

## What Changes

- **Share precision (a)**: Display ownership share with 4 decimal places instead of rounding
- **Import error export (b)**: Add per-HOA and combined error list download as `.txt` after failed import
- **Balance cross-year validation (c)**: During import, validate that opening balance of year N+1 equals closing balance of year N when that year exists in the database
- **Duplicate charge line handling (d)**: When `nal_czynsz.txt` contains rows with identical `apartmentId + period + externalLineNo`, do not overwrite — insert with an artificially incremented line number (original line no + 1000000)
- **Future month hiding (f)**: On payment and charge list views, hide months/periods beyond the most recent data date for that HOA

## Capabilities

### Modified Capabilities

- `data-import`: Balance cross-year validation (c); import error export (b); duplicate charge line handling (d)
- `charges-and-payments`: Share display precision (a); future month hiding (f)

## Impact

- **Importer library** (`src/lib/import/`): validators, import-handler, charges importer, payments importer
- **Display components** (`src/components/`): share percentage formatting, month filtering
- **Prisma schema**: unchanged (precision already Decimal(14,4))
- **Import UI** (`src/app/admin/import/`): new download button section for error files
