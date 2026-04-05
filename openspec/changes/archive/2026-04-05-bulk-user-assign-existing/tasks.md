## 1. Backend — Unassigned Apartments Endpoint

- [x] 1.1 Add `mode` query param to `GET /api/admin/unassigned-apartments`: when `mode=assignable`, return apartments with `userId IS NULL` whose email exists in the users table; keep default (`mode=creatable`) behaviour unchanged
- [x] 1.2 Write unit tests for the new `mode=assignable` branch (auth, correct filtering, grouping)

## 2. Backend — Bulk Assign API Route

- [x] 2.1 Create `POST /api/admin/users/bulk-assign` route: admin-only; accepts `{ apartmentIds: string[] }`; inside a transaction, looks up each apartment's email, finds the matching user, and sets `apartment.userId`; deduplicates by email; counts `assigned`, `skipped`, `errors`; returns the result
- [x] 2.2 Write unit tests for the bulk-assign route (auth, happy path, deduplication, race-condition skip, no-matching-user skip)

## 3. UI — Extract Shared HoaCard Component

- [x] 3.1 Extract the `HoaCard` sub-component from `src/app/admin/users/bulk-create/page.tsx` into `src/app/admin/users/bulk-create/HoaCard.tsx`; update `page.tsx` to import it; verify both files stay under 200 lines

## 4. UI — Bulk-Create Page Mode Switcher

- [x] 4.1 Add shadcn/ui `Tabs` to the bulk-create page with two tabs: "Utwórz konta" (existing create flow) and "Przypisz istniejące" (new assign flow)
- [x] 4.2 In the "Przypisz istniejące" tab: fetch from `GET /api/admin/unassigned-apartments?mode=assignable`, display the same HOA card layout with checkboxes, submit to `POST /api/admin/users/bulk-assign`, and display a success/error alert with assigned/skipped counts
- [x] 4.3 Add empty-state message for the "Przypisz istniejące" tab when no assignable apartments exist
- [x] 4.4 Write unit tests for the updated page (tab switching, assign flow fetch and submit, empty state, error state)

## 5. E2E Tests

- [x] 5.1 Write a Playwright E2E test covering the assign-existing flow: seed a user and an unassigned apartment with matching email, navigate to the bulk-create page, switch to the "Przypisz istniejące" tab, select the apartment, submit, and assert the success alert and that the apartment is now assigned
