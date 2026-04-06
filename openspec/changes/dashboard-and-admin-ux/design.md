# Design: Dashboard and Admin UX Improvements

## Context

The current application has several display inconsistencies:

- HOA admin cards show financial summaries fetched via extra API calls; import dates (already on HOA record) are more relevant there.
- The payments summary card aggregates all apartments into one number, losing per-HOA context.
- Charges pages have collapsible year groups; payments pages do not — inconsistent UX.
- Long lists (users, apartments) already have server-side pagination in the API but the admin user list doesn't use it.
- The dashboard apartment list has no HOA grouping or header display.
- Notifications are rendered as a flat list, losing HOA context.

## Goals / Non-Goals

**Goals:**

- Replace financial summary on HOA admin cards with import dates.
- Group payment summary per HOA on the dashboard.
- Add collapsible year groups to all payments pages.
- Add pagination to admin user list and apartment lists.
- Show HOA header above each HOA group in the dashboard apartment list.
- Group notifications by HOA in sidebar and charges page.

**Non-Goals:**

- No new DB migrations or API routes.
- No changes to import logic or data model.
- No changes to PDF export.

## Decisions

### HOA admin cards — import dates

**Decision**: Remove the per-HOA `/financial-summary` fetch; instead display `apartmentsDataDate`, `chargesDataDate`, `notificationsDataDate` from the HOA list API response (already returned by `GET /api/admin/hoa`). The existing HOA list query needs to be extended to return these fields.

**Rationale**: Avoids N+1 API calls (one per HOA card) and the data is already available on the HOA record.

### Dashboard payments summary per HOA

**Decision**: In `PaymentsSummaryCard`, group payments by `homeownersAssociationId` (available via the apartment relation) and display one row per HOA with its name and summed closing balance.

**Rationale**: `findUserWithApartmentsCached` already fetches `homeownersAssociation` on each apartment; no new query needed.

### Collapsible year groups on payments pages

**Decision**: Create a `PaymentsYearAccordion` client component using `@radix-ui/react-collapsible` (already installed), mirroring the pattern from `ChargesDisplay`. The payments list page (`/dashboard/payments`) and the admin apartment details page will use it.

**Rationale**: Consistent with the existing charges page pattern. Uses the same available Collapsible primitive.

### Pagination on long lists

**Decision**:

- Admin user list (`/admin/users`): add `page`/`limit` query params to the existing `GET /api/admin/users` endpoint and use URL-driven pagination in the page component.
- HOA apartment list (`/admin/apartments/[hoaId]`): pagination already exists in the API; the page component already uses it — no change needed.
- Dashboard charges page (`/dashboard/charges`): add client-side pagination (slice the `chargesByPeriod` map) since data is already fetched server-side and grouped client-side.

**Rationale**: Server-side pagination for admin user list keeps it scalable. The HOA apartment list already has pagination. Charges page is small enough for client-side slicing.

### HOA header in dashboard apartment list

**Decision**: In `ApartmentsSection`, group apartments by HOA and show `apartment.homeownersAssociation.header` above each group. The `findUserWithApartmentsCached` query already fetches `homeownersAssociation.header`.

**Rationale**: Zero additional queries; data is already available.

### Group notifications by HOA

**Decision**: In `NotificationsSidebar` and `MultiChargesDisplay`, group notifications/charges by HOA (using `homeownersAssociationId` and `hoaName`/`hoaHeader`). Each group shows the HOA header (if set) and then the list of items.

**Rationale**: Existing data already carries `hoaHeader` and `apartmentAddress`; grouping is purely a display transformation.

## Risks / Trade-offs

- [Pagination state in URL] URL-driven pagination in admin user list means the browser back button works correctly → no risk.
- [Collapsible on payments] No `@radix-ui/react-accordion` available; using `Collapsible` from existing `src/components/ui/collapsible.tsx` → same as charges implementation.

## Migration Plan

All changes are purely frontend display changes. No DB or API migration needed. Deploy as a single release.

## Open Questions

None.
