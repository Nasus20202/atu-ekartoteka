# Proposal

## Why

Every page shares the browser title `ATU Ekartoteka`, so tabs, history and bookmarks cannot tell the pages apart. Admin HOA and apartment pages, and the tenant charge and payment pages, would benefit from the name of the HOA, apartment or address, but those names are personal data and must only be shown to users allowed to see them.

## What Changes

- The root layout sets a title template `%s | ATU Ekartoteka`, so each page sets only its own name.
- Admin HOA and apartment pages take their title from the database, for admins only. Other users get a generic title and no lookup happens.
- The tenant charge and payment pages include the apartment address label only when the signed-in user owns the apartment.
- Not-found and error pages set their own titles.
- The app name and title template live in one module, `src/lib/metadata/document-title.ts`, so the client error pages can use them.

## Capabilities

### New Capabilities

- `page-titles`: Browser document titles for every page, and the rule for which names may appear in them.

### Modified Capabilities

None.
