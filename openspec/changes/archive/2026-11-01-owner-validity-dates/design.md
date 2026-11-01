# Design

## Context

Each `lok` row maps to one `Apartment` row, keyed by `externalOwnerId` + `externalApartmentId`. The apartment parser reads the fields up to `externalIdIndex + 6` (email) and the area and height fields, but not the two date fields that follow the email (`+7`, `+8`). The importer deactivates only rows that are absent from the file (`importers/apartments.ts`), so a former owner that is still listed stays active. `hasApartmentChanged` (`importers/apartment-data.ts`) decides which rows are updated.

The apartment detail page is `src/app/admin/apartments/[hoaId]/[apartmentId]/`, and its data comes from `ApartmentDetailDto`.

See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- Store the validity dates per apartment row and deactivate former owners from the file alone.
- Keep the import of files without dates unchanged.

**Non-Goals:**

- A separate owner-history table. A row already is one owner on one apartment.
- Period-aware matching of charges and payments.
- Changing which user is assigned to an apartment.

## Decisions

**Dates on the `Apartment` row.** Add `validFrom DateTime?` and `validTo DateTime?` to `Apartment`, following the nullable `DateTime?` style of `apartmentsDataDate`. Alternative: an `OwnerPeriod` table. Rejected: the row already is the owner-apartment link, and a new table would add joins to every apartment query for no gain yet.

**Deactivate on `validTo`, not on absence.** A row whose `validTo` is on or before the import day is set to `isActive: false`, even if it is in the file. Alternative: keep absence-only deactivation. Rejected: the exports list the former owner, so the duplicate-address marker keeps showing.

**Import day comes from `getRequestNow()`.** The import route passes the request time through the import options, and the importer compares against its UTC day. Alternative: `new Date()` inside the importer. Rejected: `getRequestNow` is already used by routes and can be frozen in e2e tests, so the deactivation scenario stays deterministic.

**Shared date parsing.** Extract a `parseYyyymmdd(value: string): Date | null` helper from `parseWmbDate` (`src/lib/import/utils.ts`) so both the WMB dates and the new row dates use one implementation. Dates are stored at midnight UTC, the same as WMB dates.

**Change detection.** Include `validFrom` and `validTo` in `EXISTING_APARTMENT_SELECT` and `hasApartmentChanged`, so reimporting a file with new dates updates the rows.

**Admin display.** Show `Właściciel od` in `ApartmentInfoCard` using `formatDate` from `@/lib/utils`. Tenants do not get the field.

**`userId` stays as it is.** The existing rule keeps a tenant's assignment on import. If the former owner's row is deactivated while a tenant is assigned to it, the tenant's apartment shows as inactive until an admin reassigns it. This is the current assignment rule applied to the new state, not a new behaviour.

## Risks / Trade-offs

- [A wrong end date in a legacy file deactivates a current owner] → The deactivation applies only when `validTo` is set and has passed. The admin can see the owner-since date and the status on the detail page. The next import re-applies the file's dates, so a reactivation by hand lasts only until the next import.
- [Existing rows have no dates until a reimport] → The migration leaves them null. Former owners already in the database stay active until the admin reimports the file that holds the end dates. The import result shows the updated count.
- [Assigned tenant loses an active apartment on owner change] → Documented above. The admin reassigns the apartment. Changing this needs a separate decision.
- [Date parsing differs between WMB and `lok` rows] → Both use the shared helper, and the unit tests cover blank, malformed and 15-field rows.

## Migration Plan

1. Add the migration that creates the two nullable columns. It is additive, so it runs with no backfill.
2. Deploy the parser and importer changes. Existing rows keep null dates, so their behaviour is unchanged until a reimport.
3. Reimport the affected HOAs, starting with the SYM17 export that has an owner change.

Rollback: revert the code and drop the two columns. Rows deactivated by the new import stay inactive, and an admin can reactivate them from the detail page.
