# Tasks

## 1. Shared infinite-scroll building blocks

- [x] 1.1 Implement `useInfiniteList<T>` in `src/lib/hooks/use-infinite-list.ts` (append + de-dup by `getId`, `hasMore`, `total`, reset on `queryKey` with AbortController + generation counter, in-flight guard, error pause with constant `Nie udało się wczytać kolejnych pozycji`, `refresh` re-fetching pages 1..N); verify with `src/lib/hooks/__tests__/use-infinite-list.test.ts` covering every behaviour listed in design §1 (`pnpm vitest run src/lib/hooks`)
- [x] 1.2 Implement `InfiniteScrollSentinel` in `src/components/ui/infinite-scroll-sentinel.tsx` (IntersectionObserver with `PREFETCH_MARGIN` constant, inline `Ładowanie...` spinner with `aria-live`, `Pokaż więcej` fallback button, `Alert` on error, no auto-trigger while error, renders nothing when complete, no-op without IntersectionObserver); verify with `src/components/ui/__tests__/infinite-scroll-sentinel.test.tsx` using a stubbed `IntersectionObserver`

## 2. HOA apartments list

- [x] 2.1 Rewrite `use-hoa-apartments.ts` on top of `useInfiniteList` (`queryKey = hoaId|search|activeOnly`, no `page` URL param, `hoa` and `total` from the first response); update `__tests__/use-hoa-apartments.test.ts` to cover append, reset on search/activeOnly change and ignoring `?page=3`
- [x] 2.2 Update `admin/apartments/[hoaId]/page.tsx` to render `InfiniteScrollSentinel` instead of `ApartmentsPagination`, drop `goToPage` and `page: '1'` URL updates; delete `apartments-pagination.tsx`, its test, and `getPageItems`/`PageItem`/`PAGE_WINDOW` with their tests in `apartment-list-utils`; add a unit test that duplicate-address highlighting spans two loaded pages; verify `pnpm lint` and `pnpm vitest run src/app/admin/apartments` pass
- [x] 2.3 Add Playwright E2E in `e2e/admin/admin-apartments.spec.ts`: a HOA with more than 20 apartments (extend seed only if needed) shows no page buttons, scrolling loads all apartments without duplicates, and searching restarts the list; verify with `pnpm playwright test e2e/admin/admin-apartments.spec.ts`

## 3. Admin users list

- [x] 3.1 Rewrite `use-admin-users.ts` on top of `useInfiniteList` (`queryKey = filter|debouncedSearch`, expose `refresh`, remove `page`/`setPage`/`totalPages`); update `__tests__/use-admin-users.test.ts` for append, reset on filter/search, and `refresh` keeping the loaded range while dropping a user that no longer matches
- [x] 3.2 Update `admin/users/page.tsx` to use `InfiniteScrollSentinel` and `refresh` after create/update actions, remove `UsersPagination` and `setPage(1)`; extract code so the file is ≤ 200 lines; delete `users-pagination.tsx` and its test; update `__tests__/page.test.tsx`; verify `pnpm lint` and `pnpm vitest run src/app/admin/users`
- [x] 3.3 Add/extend Playwright E2E (`e2e/admin/admin-users.spec.ts` / `admin-users-filter.spec.ts`) asserting no page controls, more users appear after scrolling or activating `Pokaż więcej` when seed exceeds one page, and switching filter shows the new first page; verify with `pnpm playwright test e2e/admin/admin-users*.spec.ts`

## 4. Bulk user management HOA list

- [x] 4.1 Rewrite `management/use-unassigned-hoas.ts` as a wrapper over `useInfiniteList` (`queryKey = mode`, `getId = hoaId`, `reload` → `refresh`/reset) and replace the "Pokaż więcej wspólnot" button in `management/apartment-list.tsx` with `InfiniteScrollSentinel`; update `management/__tests__` (hook + page) to cover auto-append keeping selection; verify `pnpm vitest run src/app/admin/users/management`
- [x] 4.2 Update bulk-management E2E specs that may rely on the old button label (`admin-user-management-*.spec.ts`, `admin-user-managment-assign-existing.spec.ts`) and verify they pass with `pnpm playwright test e2e/admin/admin-user-manag*`

## 5. Integration check

- [x] 5.1 Run `pnpm lint`, `pnpm vitest run`, and the full `pnpm playwright test` suite; manually scroll each of the three lists in the dev server (light and dark theme, mobile width) and confirm no page controls remain (`grep -rn "Poprzednia\|Następna\|Strona .* z" src/app` returns nothing)
