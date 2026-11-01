# Proposal

## Why

Each row of `lok.txt` is one owner on one apartment. Besides the owner data, the row carries the owner's start date and, for a former owner, an end date. The importer ignores both dates.

In the exports checked (SYM17, PRZ22, APO52, TEST), a former owner is still listed in `lok.txt` after an owner change, so the importer keeps that row active. The admin list then shows both rows with `Duplikat adresu`, and the app cannot tell which owner is current or since when. Each end date is the day before the next owner's start on the same apartment, so the pairing is consistent.

## What Changes

- Parse the start date and end date of each `lok.txt` row, including rows where the owner name contains an extra `#`.
- Store them on the apartment row as `validFrom` and `validTo` (nullable), with a migration.
- **BREAKING**: on import, a row whose `validTo` is on or before the import date is set to `isActive: false`. Today such a row stays active. This changes existing owner-switch behaviour and needs approval before the change is applied.
- Show "Właściciel od" (owner since, the `validFrom` date) on the admin apartment detail page.
- Add an e2e fixture with an owner change that uses real date fields.

Non-goals:

- Matching payments and charges by owner period. This stays with the existing owner+apartment key.
- Showing owner dates to tenants.
- Changing how `userId` assignments are kept on import.
- Changing the `.wmb` export date handling.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `data-import`: new requirement for parsing and storing owner validity dates, and for deactivating former-owner rows whose end date has passed.
- `apartment-management`: the admin apartment detail page shows the owner-since date.

## Impact

- `prisma/schema.prisma` and a new migration: `validFrom`, `validTo` on `Apartment`.
- `src/lib/parsers/apartment-parser.ts`: read fields at `externalIdIndex + 7` and `+ 8`.
- `src/lib/import/importers/apartments.ts` and `apartment-data.ts`: store the dates, include them in change detection, deactivate ended rows.
- `src/lib/types/dto/apartment-dto.ts` and `src/app/admin/apartments/[hoaId]/[apartmentId]/apartment-info-card.tsx`: owner-since display.
- `e2e/test-data/import/`: new fixture folder with owner change dates.
- Unit tests next to the parser, importer and DTO code.
