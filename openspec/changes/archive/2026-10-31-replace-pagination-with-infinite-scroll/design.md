# Design

## Context

Three admin lists page through offset-paginated APIs (see proposal.md):

| List                 | Hook / component today                                                                                            | API                                                                                                | Page size                                   | Order                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| HOA apartments       | `use-hoa-apartments.ts` (reads `page` from URL) + `ApartmentsPagination`                                          | `GET /api/admin/apartments?hoaId&page&limit&search&activeOnly` → `{ apartments, hoa, pagination }` | 20 (client `PAGE_SIZE`)                     | natural building/number (in-memory sort of keys, then slice) |
| Users                | `use-admin-users.ts` (`page` in state, debounced search, `fetchUsers` re-run after mutations) + `UsersPagination` | `GET /api/admin/users?role                                                                         | status&page&search`→`{ users, pagination }` | 50 (server `DEFAULT_PAGE_SIZE`)                              | `createdAt desc` |
| Bulk management HOAs | `use-unassigned-hoas.ts` (already appends; `loadMore`, `hasMore`) + "Pokaż więcej wspólnot" button                | `GET /api/admin/unassigned-apartments?mode&page` → `{ hoas, pagination }`                          | 10 HOAs                                     | HOA name, id                                                 |

All three APIs already return `pagination: { page, totalPages, ... }`, so the change is client-only. Admin pages follow the project pattern: `'use client'`, `useState`/`useEffect`/`fetch`, no SWR/React Query. jsdom (Vitest) has no `IntersectionObserver`.

`src/app/admin/users/page.tsx` is already 264 lines (over the 200-line rule); this change must not grow it and should shrink it.

## Goals / Non-Goals

**Goals:**

- One reusable accumulation hook + one sentinel component used by all three lists.
- Race-safe resets (query change while a page is in flight).
- Keep each touched file ≤ 200 lines.

**Non-Goals:**

- API/DB changes, cursor pagination, virtualization, scroll restoration (see proposal Non-goals).

## Decisions

### 1. Generic hook `useInfiniteList<T>` in `src/lib/hooks/use-infinite-list.ts`

```ts
interface InfinitePage<T> {
  items: T[];
  page: number;
  totalPages: number;
  total?: number;
}
type PageFetcher<T> = (
  page: number,
  signal: AbortSignal
) => Promise<InfinitePage<T>>;

function useInfiniteList<T>(options: {
  fetchPage: PageFetcher<T>;
  queryKey: string; // serialised query; change ⇒ reset to page 1
  getId: (item: T) => string; // de-duplicate on append
}): {
  items: T[];
  total: number | null;
  loading: boolean; // first page
  loadingMore: boolean; // next page
  hasMore: boolean; // loadedPage < totalPages
  error: string | null;
  loadMore: () => void; // no-op while loading/loadingMore or !hasMore
  refresh: () => Promise<void>; // re-fetch pages 1..loadedPage in parallel, replace items
};
```

- Reset: an effect keyed on `queryKey` aborts the in-flight `AbortController`, clears items and loads page 1. Every request also carries a generation counter (same pattern as `latestUsersRequestId` in `use-admin-users.ts`); results from an older generation are dropped. This satisfies "Stale response ignored".
- In-flight guard: a ref (`requestingRef`) prevents duplicate `loadMore` for the same page, independent of render timing.
- De-duplication by `getId` on append protects against offset shifts when rows are inserted between requests.
- Failure: `error` is set to `Nie udało się wczytać kolejnych pozycji` (constant), items are kept, and automatic loading pauses until `loadMore` is called explicitly (prevents a retry loop while the sentinel stays visible).
- `refresh` re-fetches pages `1..loadedPage` with `Promise.all` and replaces items in one state update; after removals (approved user leaves `Oczekujące`) the next offset is then consistent with the server. Chosen over "single request with `limit = loadedCount`" because the latter breaks `page * limit` offsets for subsequent loads; chosen over "reset to page 1" because the spec requires keeping the loaded range.

Alternative considered: a React Query/SWR `useInfiniteQuery` — rejected, conflicts with the project's no-data-library convention and adds a dependency.

### 2. `InfiniteScrollSentinel` in `src/components/ui/infinite-scroll-sentinel.tsx`

Props: `{ hasMore, loading, error, onLoadMore }`. Renders below the list:

- an empty `div` observed by `IntersectionObserver` (`rootMargin: '200px'` constant `PREFETCH_MARGIN`) that calls `onLoadMore` when intersecting, unless `error` is set;
- while `loading`: `Loader2` spinner + `Ładowanie...` (same visual as `LoadingCard`, inline, `aria-live="polite"`);
- otherwise, while `hasMore`: an `outline` `Button` `Pokaż więcej` (fallback for keyboard/AT and browsers lacking `IntersectionObserver` — the component skips observing when `typeof IntersectionObserver === 'undefined'`);
- `error` rendered with the existing `Alert` component above the button.
- Renders nothing when `!hasMore && !loading && !error`.

Alternative: scroll-event listener with `scrollHeight` math — rejected; `IntersectionObserver` is native, cheaper and works inside any scroll container.

### 3. List migrations

- **Apartments**: `use-hoa-apartments.ts` keeps URL-driven `search`/`activeOnly` and `updateURL`, stops reading/writing `page`, and wraps `useInfiniteList` with `queryKey = hoaId|search|activeOnly`. The fetcher also captures `hoa` from the first response (stored in hook state). `total` comes from `pagination.total` for the `Znaleziono N mieszkań` line. `page.tsx` drops `goToPage`/`ApartmentsPagination` and the `page: '1'` URL updates. `computeDuplicateActiveAddresses` already runs over the `apartments` array, so it now naturally covers all loaded rows.
- **Users**: `use-admin-users.ts` keeps `filter`, `userSearch`, debounce; drops `page`/`setPage`/`totalPages`; `queryKey = filter|debouncedSearch`; `buildUsersQuery(filter, page, search)` keeps its signature and is called from the fetcher. `fetchUsers` callers in `page.tsx` switch to `refresh`. `page.tsx` removes `setPage(1)` in the filter handler and `UsersPagination`; its dialog state and mutations move to `use-user-actions.ts` to bring the page under 200 lines.
- **Bulk management**: `use-unassigned-hoas.ts` becomes a thin wrapper over `useInfiniteList` with `queryKey = mode`, `getId = hoa.hoaId`; `reload(mode)` maps to `refresh` when mode is unchanged, otherwise the mode change already resets. `apartment-list.tsx` replaces the "Pokaż więcej wspólnot" button with `InfiniteScrollSentinel`. Selection is held by `useHoaSelection` outside the list hook and is unaffected by appends.

### 4. Deletions

`apartments-pagination.tsx` (+ test), `users-pagination.tsx` (+ test), `getPageItems`/`PageItem`/`PAGE_WINDOW` in `apartment-list-utils.ts` (+ its tests). `PaginationData` type moves away from the deleted component — replaced by `InfinitePage<T>`.

### 5. Testing approach

- Unit (Vitest): `useInfiniteList` — append, de-dup, `hasMore`, reset on `queryKey`, stale-generation drop, in-flight guard, error pause + retry, `refresh` replaces loaded range. `InfiniteScrollSentinel` — with a stubbed `IntersectionObserver` (`vi.stubGlobal`) triggering callbacks; fallback button; hidden when complete; error display. Updated tests for the three list hooks and pages.
- E2E (Playwright): apartments list with > 20 seeded apartments in one HOA scrolls to load all and shows no page buttons; users list loads beyond 50 users on scroll (or via `Pokaż więcej` click for determinism); bulk management HOA list auto-loads. Check `e2e/global-setup.ts` seed volume; add seed rows only within a dedicated test HOA if the existing data is below one page.

### API shapes (unchanged, for reference)

```
GET /api/admin/apartments?hoaId=<id>&page=2&limit=20&search=&activeOnly=false
200 { apartments: ApartmentSummaryDto[], hoa: HomeownersAssociationSummaryDto|null,
      pagination: { page: 2, limit: 20, total: 70, totalPages: 4 } }

GET /api/admin/users?status=PENDING&page=2&search=kow
200 { users: UserDto[], pagination: { page: 2, limit: 50, total: 120, totalPages: 3 } }

GET /api/admin/unassigned-apartments?mode=creatable&page=2
200 { hoas: HoaGroup[], pagination: { page: 2, limit: 10, total: 23, totalPages: 3 } }
```

No new DB fields or migrations.

## Risks / Trade-offs

- [Offset pagination drifts when rows are inserted/removed between page loads] → de-dup by id on append; `refresh` after admin actions re-aligns offsets. Remaining drift (a concurrent insert by someone else) can at worst hide one row until the next refresh — acceptable for admin lists.
- [Apartments API sorts all matching keys in memory on every page request] → unchanged cost per request; infinite scroll makes requests sequential and only on demand, so total load is equal to clicking through pages.
- [Sentinel visible immediately on short screens triggers back-to-back loads] → intended (fills the viewport); in-flight guard serialises them.
- [Large users list refresh issues N parallel requests] → N is the number of pages the admin scrolled through (each 50 rows); acceptable.
- [Bookmarked `?page=N` links change meaning] → ignored and silently start at top; documented in the apartment-management spec delta.
- [Spec inconsistency: user-management said default page size 20, code uses 50] → the spec is aligned to the code (50, capped at 200) in this change's user-management delta; runtime behaviour is unchanged.

## Migration Plan

Client-only deploy; no data migration. Rollback = revert the commit(s).
