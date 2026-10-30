# Design

## Context

After `replace-pagination-with-infinite-scroll`, both target pages render items from an infinite list hook:

- `admin/apartments/[hoaId]/page.tsx` maps `apartments` to `ApartmentCard` in a two-column grid; duplicate detection comes from `computeDuplicateActiveAddresses`. The `PageHeader` action slot holds the `Tylko aktywne` checkbox.
- `admin/users/page.tsx` (180 lines) maps `users` to `UserCard`; the filter row is `UserFilters`. `UserCard` (≈200 lines) holds the action buttons twice: inline buttons for `sm+` and a `DropdownMenu` (`aria-label="Akcje"`) for mobile.

There is no client-side preference storage yet (`next-themes` handles the theme itself). Admin pages are client components but are still server-rendered once, so `localStorage` is not available during the first render.

## Goals / Non-Goals

**Goals:**

- One shared segmented control, view switch and preference hook for both lists.
- No duplicated user-action logic between card and table.
- Sorting that stays correct while infinite scrolling appends pages.
- No hydration mismatch warnings.

**Non-Goals:**

- See proposal Non-goals. No column selection or sticky headers.

## Decisions

### 1. Preference hook `useListViewMode(storageKey)` in `src/lib/hooks/use-list-view-mode.ts`

```ts
export enum ListViewMode {
  CARDS = 'cards',
  TABLE = 'table',
}
export const LIST_VIEW_STORAGE_KEYS = {
  apartments: 'atu:list-view:apartments',
  users: 'atu:list-view:users',
} as const;

function useListViewMode(
  storageKey: string
): [ListViewMode, (mode: ListViewMode) => void];
```

- Built on `useSyncExternalStore` with a tiny module-level store: `getSnapshot` reads `localStorage[storageKey]` (wrapped in try/catch, values outside `ListViewMode` → `CARDS`), `getServerSnapshot` returns `CARDS`, `subscribe` listens to the `storage` event plus an in-module listener set notified on `setMode`. Removed values (e.g. a stored `list` from the earlier list-view draft) fall back to `CARDS`.
- `setMode` writes in try/catch; when storage throws, the value is kept in an in-memory `Map` fallback so the switch still works for the visit (spec "Storage unavailable").
- Alternative: `useState` + `useEffect` reading storage after mount — rejected; it needs a synchronous setState in an effect (blocked by the project's `react-hooks` lint rules) and causes the same flash anyway. Alternative: URL param — rejected by the user's choice.
- Known trade-off: the server render and the first client paint show cards; React then switches to the stored view before the list loads (the list itself is a spinner on first paint, so no visible card flash in practice).

### 2. `SegmentedControl` in `src/components/ui/segmented-control.tsx` and `ListViewSwitch` in `src/components/ui/list-view-switch.tsx`

The segmented-control style is a shared, generic component: `SegmentedControl<T extends string>` takes `{ options: readonly { value, label, icon? }[]; value; onChange; label; className? }` and renders any number of options. It is a `<div role="group" aria-label={label}>` styled like `TabsList`/`TabsTrigger` — muted pill container, active option on `bg-background text-foreground shadow`, inactive borderless with muted text — with native buttons carrying `aria-pressed`, so keyboard activation works without extra handlers.

`ListViewSwitch` is the domain wrapper used by both admin lists: it passes the two `Kafelki` / `Tabela` options with `LayoutGrid` / `Table2` icons and the `Widok listy` group label.

Placement: apartments — in the `PageHeader` action next to `Tylko aktywne` (flex row, gap-4). Users — at the right end of the filter row (`UserFilters` wrapper becomes `flex justify-between` with the switch outside the wrapping button group).

### 3. Table views `admin/apartments/[hoaId]/apartment-table.tsx` and `admin/users/users-table.tsx`

- Both use the shared shadcn `Table` primitives (`table.tsx`) inside a `rounded-md border bg-card` wrapper; the wrapper scrolls horizontally on narrow screens so the page itself never scrolls sideways.
- Apartments columns: `Adres`, `Właściciel`, `Udział` (right-aligned, tabular-nums, `-` when unknown), `Status` (status and duplicate badges) and a chevron column. The address cell holds a link whose `after:absolute after:inset-0` overlay makes the whole row clickable while keeping one accessible link named by the apartment label.
- Users columns: `Użytkownik` (name or email), `E-mail`, `Status`, `Mieszkania` (count with `pluralizePl`), and `Akcje` (`UserActionMenu`). No row link — users have no details page.
- Badges and the user action builder are shared with the cards, so markers and menu behaviour stay identical.

### 4. Server-side column sorting

- `src/lib/utils/sort.ts` holds the shared `SortDirection` (`asc`/`desc`), `SortState<K>`, `ApartmentSortKey`, `UserSortKey` and `toggleSort` (same column flips asc/desc, another column starts ascending). No client row sorting: a header click changes the list query instead.
- `src/components/ui/sortable-table-head.tsx` renders a `TableHead` with `aria-sort` (`none` / `ascending` / `descending`) and a button with an arrow indicator; it is reusable by any table.
- The list hooks own the sort state (`useHoaApartments`, `useAdminUsers`) and add `sort`/`order` to every page request. The sort is part of the infinite-list `queryKey`, so changing it refetches page 1 in the new order; the previously loaded rows stay visible until that page arrives and are then replaced, so the list never collapses into a loading placeholder. Scrolling appends later pages in the same order.
- `GET /api/admin/apartments` accepts `sort=label|owner|share|status` and `order=asc|desc`; an unknown sort key is ignored and the natural building/number order is kept. `findApartmentsPaginated` orders and paginates in the database. The text columns use the ICU collation `pl_numeric` (`pl-u-kn-true`, migration `20261030233000_polish_numeric_collation`), so a plain Prisma `orderBy` gives Polish, numeric-aware order ("2" before "10", "Ł" after "L"); every ordering ends with `id` so pages never overlap.
- `GET /api/admin/users` accepts `sort=name|email|status|apartments` and `order=asc|desc` and rejects unknown values with `Nieprawidłowe sortowanie`. `findTenantUsers` maps them to Prisma `orderBy`: name sorts with null names last and falls back to email, status uses the enum order, apartments uses `_count`; email breaks ties.
- Apartments sort by label (address, then natural building/number), owner, share ratio (missing shares last when ascending) and active status. Users sort by name (email fallback), email, status rank (`Oczekuje`, `Zatwierdzony`, `Odrzucony`) and assigned-apartment count.
- Defaults are unchanged: no `sort` param keeps the API order (apartments natural, users newest first). Sort resets on reload, like the loaded pages.

### 5. View-change animation `src/components/ui/view-transition.tsx`

`ViewTransition` sets `key={view}` on its wrapper, so switching views remounts the list subtree with `motion-safe:animate-view-switch` — a 200 ms fade plus 6 px rise defined in `tailwind.config.ts`. `motion-reduce:animate-none` keeps the switch instant for users who prefer reduced motion. Both pages wrap the rendered cards/table in it; the items themselves are not animated again when infinite scrolling appends a page, because the key only changes with the view.

### 6. Page wiring

Each page calls `useListViewMode(LIST_VIEW_STORAGE_KEYS.x)` and renders cards or a table from the same `items` array; the `InfiniteScrollSentinel` stays below either. The sort state lives in the list hooks, not in the tables, so switching views keeps the sort and the loaded pages. `admin/users/page.tsx` must stay ≤ 200 lines: the user list rendering (choosing card/table) lives in `users-list.tsx`.

### API / data

No DTO or DB changes. Both list endpoints gain optional `sort` and `order` query params (defaults preserve the current order) and the list hooks send them. Storage keys are browser `localStorage` only.

## Risks / Trade-offs

- [First paint shows cards before the stored table view] → the loaded list arrives after hydration, so in practice only the spinner is visible; covered by an E2E assertion that the table renders after reload.
- [Sorting replaces the loaded rows] → the previous rows stay visible until the sorted first page arrives, then swap in place without re-running the view animation.
- [Apartment sorting loads the sort keys of all matches] → the same query was already needed for natural order; only the page rows are loaded in full.
- [Extracting `UserCard` actions could change card behaviour] → existing `user-card.test.tsx` and users page tests must pass unchanged.
- [Tables hide external IDs that admins may search by] → search still matches them; the table is a scanning view, details are one click away. Recorded as a deliberate choice from the user's answers.

## Migration Plan

Client-only; no data migration. Rollback by reverting the commit; stored keys are harmless if unused.
