# Proposal

## Why

The admin apartments and users lists show one large card per item, so a screen fits only 6–8 apartments or 3–4 users. With infinite scrolling the lists are now one long page, and admins who scan many items (a HOA with 150 apartments, a long pending queue) have to scroll a lot. The client asked for a compact view they can switch to, with sortable columns.

## What Changes

- Add a view switch (`Kafelki` / `Tabela`) to the HOA apartments list (`/admin/apartments/[hoaId]`) and the admin users list (`/admin/users`). Cards stay the default, and switching views animates the already-loaded items.
- Add a table view for apartments: sortable columns `Adres`, `Właściciel`, `Udział` and `Status`, with the same inactive and duplicate-address markers as the cards; activating the address opens the apartment details.
- Add a table view for users: sortable columns `Użytkownik`, `E-mail`, `Status` and `Mieszkania`, plus the same `Akcje` menu as the card for that status.
- Sort the rows from the column headers on the server: the sort column and direction are sent with the list request, so every page arrives in the same order and infinite scrolling keeps appending rows in that order.
- Remember the chosen view per list in the browser, so each list reopens in the last view used.
- Both views use the same data, search, filters and infinite scrolling.

## Non-goals

- No switch on the bulk account management page, the HOA list or tenant pages.
- No column selection or sticky headers.
- No server-side or per-account storage of the preference (no DB change).
- No change to what the cards show.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `visual-design`: adds the cards/table switch convention for admin lists — the shared segmented control, its accessibility, the view-change animation and remembering the choice per browser.
- `apartment-management`: adds the apartment table content, sorting and row links.
- `user-management`: adds the user table content, sorting and actions.

## Impact

- Code: new shared segmented control, view switch and view transition components plus a preference hook (`src/components/ui`, `src/lib/hooks`); new `apartment-table.tsx` and `users-table.tsx` with sortable headers; `admin/apartments/[hoaId]/page.tsx` and `admin/users/users-list.tsx` render the chosen view; user card actions are extracted so card and table share them; the apartments and users list APIs accept `sort`/`order` and the list hooks send them with every page request.
- Tests: unit tests for the hook, switch, segmented control, sortable header, tables, the sorted queries and both pages; Playwright E2E for switching, sorting, scrolling and remembering the view.
- Dependencies: none.
- Builds on `replace-pagination-with-infinite-scroll` (not yet archived).
