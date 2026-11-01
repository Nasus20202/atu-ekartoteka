# Proposal

## Why

The admin apartment detail page shows `Właściciel od` (owner since) but not the end date of a former owner. The end date is stored and drives `isActive`, so an admin cannot see why a former owner row is inactive.

## What Changes

- Replace the `Właściciel od` field with one field, `Okres własności` (owner period).
- Show `od {validFrom}` when only the start date is known, `do {validTo}` when only the end date is known, and `od {validFrom} do {validTo}` when both are known. Show `Brak` when neither is known.
- Expose `validTo` on `ApartmentDetailDto`, alongside `validFrom`.

Non-goals:

- Showing owner dates to tenants.
- Changing import behaviour or the stored dates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `apartment-management`: the owner date field on the admin apartment detail page.
