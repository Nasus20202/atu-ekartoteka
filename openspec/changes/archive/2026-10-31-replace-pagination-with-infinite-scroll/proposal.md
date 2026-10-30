# Proposal

## Why

Admins browse long lists (a HOA's apartments, users, bulk-creation HOAs) and today have to scroll to the bottom and click page buttons or "Pokaż więcej wspólnot" to see more. Each page click on the apartments list replaces the content, so the admin loses context and cannot scan the whole HOA in one pass. The client asked to replace manual pages with endless scrolling everywhere.

## What Changes

- Introduce a shared infinite-scroll mechanism: a client hook that accumulates pages from the existing paginated APIs, and a sentinel component that loads the next page automatically when it scrolls into view (with a keyboard/screen-reader-accessible fallback button and a loading indicator).
- **BREAKING (UI)**: HOA apartments list (`/admin/apartments/[hoaId]`) — remove the numbered page controls (`Poprzednia` / page numbers / `Następna`); apartments are appended as the admin scrolls. The `page` query parameter is no longer written to or read from the URL; `search` and `activeOnly` remain in the URL and reset the list to the first page.
- **BREAKING (UI)**: Admin users list (`/admin/users`) — remove `Poprzednia` / `Strona X z Y` / `Następna`; users are appended as the admin scrolls. Changing filter or search resets to the first page. After an approve/assign/reject/create action the already-loaded range is refreshed in place instead of jumping back to page 1.
- Bulk user management (`/admin/users/management`) — the "Pokaż więcej wspólnot" button becomes automatic loading on scroll; the current selection is still kept.
- Duplicate-active-address highlighting on the apartments list now considers every loaded apartment, not just the current page.
- Delete the now-unused pagination components, `getPageItems` helper and their tests.

## Non-goals

- No changes to the API contracts: `/api/admin/apartments`, `/api/admin/users` and `/api/admin/unassigned-apartments` keep `page`/`limit` and their `pagination` response metadata.
- No cursor-based pagination or DB/schema changes.
- No list virtualization (windowing); the number of loaded rows per HOA/user list is small enough.
- No restoration of scroll position when navigating back from a detail page.
- Lists that are already rendered in full (HOA list, tenant dashboard, payment/charge tables) are untouched.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-design`: adds the shared infinite scrolling convention for admin lists — trigger, loading/end states, reset on filter/search change, accessible fallback, race safety.
- `apartment-management`: admin HOA apartment listing UI switches from page controls to infinite scroll (API pagination stays).
- `hoa-management`: HOA-scoped apartment browsing says "pagination" — becomes infinite scroll.
- `user-management`: user list filter-switch scenario resets the loaded list instead of a page index; "Load more HOAs" becomes automatic on scroll; the documented default user page size is corrected from 20 to 50 to match the API.
- `charges-and-payments`: the "Pagination on Admin User List" requirement (page controls) is replaced by infinite scrolling.

## Impact

- Code: `src/app/admin/apartments/[hoaId]/*` (page, `use-hoa-apartments`, `apartments-pagination` removed, `apartment-list-utils`), `src/app/admin/users/*` (page, `use-admin-users`, `users-pagination` removed), `src/app/admin/users/management/*` (`apartment-list`, `use-unassigned-hoas`), new `src/lib/hooks/use-infinite-list.ts` and `src/components/ui/infinite-scroll-sentinel.tsx`.
- Tests: unit tests for the hook, sentinel and refactored list hooks; removal of pagination component tests; new/updated Playwright E2E for scrolling the apartments and users lists.
- Dependencies: none (native `IntersectionObserver`).
- Deep links containing `?page=N` on the apartments list are silently ignored (list starts at the top).
