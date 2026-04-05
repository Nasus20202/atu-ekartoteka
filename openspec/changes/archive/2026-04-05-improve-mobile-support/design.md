## Context

The app's authenticated shell (dashboard + admin pages) was built desktop-first. The navbar already handles mobile via a hamburger menu. Everywhere else, the audit found 17 distinct overflow problems across layout primitives, data tables, info grids, charge item rows, action button bars, and card headers. All fixes are Tailwind class changes plus one small component API addition (`action` prop on `PageHeader`) — no new dependencies, no API changes.

## Goals / Non-Goals

**Goals:**

- Every page using `<Page>` renders usably at 375 px viewport width
- No element overflows its container or the viewport body
- Action button sets in headers use `DropdownMenu` where 2+ contextual actions exist
- Filter/tab rows use `flex-wrap` to remain fully visible on narrow screens
- Info grids with `text-2xl` values collapse to single column below `sm`
- Wide data tables scroll horizontally within their card/container
- Charge rows wrap price details below description on small screens
- Admin modals have edge clearance (`p-4` on overlay)
- List rows are fully tappable where navigation is the primary intent

**Non-Goals:**

- Dedicated mobile navigation redesign (navbar is already correct)
- Auth pages (already mobile-safe)
- New dependencies or new components beyond Tailwind class changes and one `action` prop

## Decisions

### 1. Fix `PageHeader` first — it is the root cause of 3 overflow issues

Issues 1, 14, 16 all stem from pages building their own `flex items-center justify-between` wrapper around `PageHeader` + action buttons. Callers have no other option because `PageHeader` has no `action` prop. Adding `action?: React.ReactNode` and rendering it inside the component's own flex row eliminates the external wrapper entirely, concentrates responsive handling in one place, and makes the title area automatically get `min-w-0` truncation.

**Alternatives considered:** Fix each page's external wrapper independently — rejected because the same pattern would be reproduced in future pages.

### 2. Use `DropdownMenu` for contextual per-item and page-level action sets; use `flex-wrap` for filter/tab rows

Contextual actions (admin users page header "Dodaj użytkownika" + "Utwórz wiele kont"; per-user-card "Zatwierdź/Odrzuć" or "Mieszkania/Zmień status") are the canonical dropdown use case — these are operations on an entity, not toggle selections. A single "Akcje" trigger button keeps the header clean on all screen sizes, not just mobile.

Filter/tab rows (the 4-button status filter) must remain fully visible simultaneously because the active state of the selected filter must be apparent. `flex-wrap` is the right fix here — all options stay visible and wrap to a second line on narrow screens. A `<Select>` would hide the active selection from other options.

**Alternatives considered:**

- `flex-wrap` for all action bars — rejected for action sets because a hidden dropdown is a better UX than two wrapped buttons at different widths.
- shadcn `Tabs` for the filter row — reasonable but introduces a migration from plain `Button` toggles; `flex-wrap` is simpler with the same result.

### 3. `ChargeItem`: remove fixed `w-24`, add `shrink-0` to right group, stack on mobile

The fixed `w-24` is the primary cause of the charge row overflow. Replacing it with `whitespace-nowrap font-bold` on the amount and `shrink-0` on the entire right group (`flex items-center gap-4 text-right shrink-0`) is the minimal fix. On very narrow screens, additionally switching the outer container to `flex-col sm:flex-row` ensures the right group never competes with the description.

The `ChargeItem` JSX is duplicated identically in both `period-card.tsx` and `multi-apartment-period-card.tsx`. Both files must be updated.

### 4. Data tables: `overflow-x-auto` wrapper inside the component, not in calling pages

`PaymentTable` and the import results table are rendered in multiple pages. Adding `overflow-x-auto` as a wrapper `<div>` inside the component itself is safer than requiring every caller to provide a scroll container.

### 5. `PaymentYearRow`: make entire row a `<Link>` with `min-w-0` protection

The row has three flex children (year/date link, PDF button, balance) in a non-wrapping row. The solution is: make the outer `<div>` a `<Link>` so the whole row is tappable, move PDF button inside the link but with `onClick` stopPropagation to prevent double-navigation, use `flex-wrap gap-2` on the row, and add `min-w-0` to the date section.

**Alternative considered:** Keep `<div>` wrapper and add full-row overlay link — rejected as more complex DOM than simply making the outer element a `<Link>`.

## Risks / Trade-offs

- **`<Page>` padding change is global** → Every page gets smaller padding on mobile. Cosmetic risk only; all affected pages currently break on mobile anyway.
- **`PageHeader` API change** → Existing callers that pass `action` externally must be migrated. Only 3 pages are affected (admin/users, bulk-create, apartments/[hoaId]). No breaking change for pages that don't pass actions.
- **Admin users `DropdownMenu` restructure** → The visual distinction between `destructive` ("Odrzuć") and `default` ("Zatwierdź") variants currently communicates action severity. Inside `DropdownMenuItem`, apply `text-destructive` class to the reject item to preserve this signal.
- **`PaymentYearRow` DOM restructure** → Playwright E2E tests that click the row by text may need updating if they target the inner `<Link>` element. Verify after change.
- **`ChargeItem` is duplicated** → If the JSX is copy-pasted rather than shared, both files need identical changes. Risk of one file being missed.

## Migration Plan

No data migration, no deployment ceremony. Changes are purely UI. Deploy as a normal release. Rollback by reverting the commit.
