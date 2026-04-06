# Proposal: Dashboard and Admin UX Improvements

## What

A set of targeted UX improvements across the tenant dashboard and admin panel:

1. **HOA admin cards** — replace financial summary (closing balance + charges due) with import dates (apartmentsDataDate, chargesDataDate, notificationsDataDate).
2. **Dashboard payments summary** — group closing balances per HOA instead of a single total.
3. **Collapsible year groups on payments pages** — accordion-style year grouping on `/dashboard/payments` and `/admin/apartments/[hoaId]/[apartmentId]`, matching the pattern already used on charges pages.
4. **Pagination on all long lists** — add pagination to admin user list, apartment list per HOA, and charges page.
5. **HOA header in dashboard apartment list** — show `HOA.header` above each HOA group of apartments on the dashboard.
6. **Group notifications by HOA** — in the notifications sidebar and on the charges page, group notifications per HOA rather than per apartment.

## Why

- Import dates on HOA cards are more actionable than financial totals, which are already visible elsewhere.
- Users with apartments in multiple HOAs need per-HOA payment context on the dashboard.
- Payment pages are the only long lists without year collapsing; consistency with charges pages is missing.
- Long lists (100+ users, 50+ apartments) have no pagination, causing slow renders and poor UX.
- When a user belongs to multiple HOAs the dashboard apartment list lacks visual hierarchy — HOA.header provides this.
- Notifications from multiple HOAs shown as a flat list lose HOA context; grouping makes them easier to scan.

## Scope

- No new DB migrations required.
- No new API routes required (all data already available or computable client-side).
- Changes are additive/display-only; no existing data is removed or altered.
