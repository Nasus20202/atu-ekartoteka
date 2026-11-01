# Tasks

## 1. Schema

- [x] 1.1 Add nullable `validFrom` and `validTo` (`DateTime?`) to `Apartment` in `prisma/schema.prisma` and create the migration; verify `prisma migrate dev` applies cleanly and `prisma generate` succeeds with the new fields on `Apartment` (`migrate dev` asks for a database reset because an already applied migration's checksum changed, so the migration was applied with `prisma migrate deploy`, which runs only pending migrations; `prisma generate` and `prisma migrate status` are clean)

## 2. Date Parsing

- [x] 2.1 Extract `parseYyyymmdd(value: string): Date | null` from `parseWmbDate` in `src/lib/import/utils.ts` and make `parseWmbDate` use it; verify the existing WMB tests still pass and add cases for blank, malformed and valid values in `src/lib/import/__tests__/utils.test.ts`
- [x] 2.2 Read the start date at `externalIdIndex + 7` and the end date at `externalIdIndex + 8` in `src/lib/parsers/apartment-parser.ts` into `validFrom` and `validTo` on `ApartmentEntry`; verify `src/lib/parsers/__tests__/apartment-parser-validity.test.ts` covers a 14-field row, a 15-field row with an extra `#` in the owner name, an empty end date and a non-date start date

## 3. Import

- [x] 3.1 Add `validFrom` and `validTo` to `EXISTING_APARTMENT_SELECT`, `hasApartmentChanged`, and the create and update data in `src/lib/import/importers/apartments.ts` and `apartment-data.ts`; verify `src/lib/import/importers/__tests__/apartments-validity.test.ts` covers creating a row with dates, a changed date counting as updated, and an unchanged date not counting as updated
- [x] 3.2 Pass the import time from `getRequestNow()` through the import options, and set `isActive: false` on rows whose `validTo` is on or before that UTC day; verify `src/lib/import/importers/__tests__/apartments-deactivation.test.ts` covers an ended row in the file (inactive), a future end date (active), a null end date (active), and a previously active row whose end date has now passed (set inactive and counted as updated)

## 4. Admin Display

- [x] 4.1 Add `validFrom` to `ApartmentDetailDto` and its mapper in `src/lib/types/dto/apartment-dto.ts`; verify the mapper test returns the date and null when there is no start date
- [x] 4.2 Show `Właściciel od` in `src/app/admin/apartments/[hoaId]/[apartmentId]/apartment-info-card.tsx` with `formatDate` and `Brak` for null; verify a component test in `src/app/admin/apartments/[hoaId]/[apartmentId]/__tests__/` renders the date (10.02.2025 for 2025-02-10) and `Brak` when empty

## 5. End-to-End

- [x] 5.1 Add `e2e/test-data/import/TEST06/lok.txt` with one former owner whose end date is before the fixed test date and one current owner whose start date is the next day on the same apartment; verify the fixture parses with the existing parser test helper
- [ ] 5.2 Add a test to `e2e/admin/import-owner-change.spec.ts` that imports TEST06 (its dates are in 2020, so the test needs no fixed clock), then checks the former owner is inactive, the current owner is active, and the detail page shows `Właściciel od`; verify the test passes with `pnpm exec playwright test e2e/admin/import-owner-change.spec.ts`

## 6. Verification

- [ ] 6.1 Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm test` and the full e2e suite; verify all pass and no changed file exceeds 200 lines

## Workflow follow-up

- Get the user's approval of the behaviour change in section 3.2 before applying the change.
- Reimport the SYM17 export after deploy and check that the former owner shows as inactive.
- Archive the change after the review requirements are satisfied.
