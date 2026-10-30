# Proposal

## Why

Some admin data was still filtered, counted or ordered in JavaScript after loading more rows than needed:

- The apartment assignment dialog loaded every apartment plus up to 1000 tenants and 1000 admins, then hid apartments held by other users in the browser. The users API caps pages at 200, so with more than 200 users, taken apartments were offered as free.
- The `N kont oczekuje na zatwierdzenie` header counted pending users among the rows already loaded, which is wrong with infinite scrolling and other filters.
- The HOA financial summary loaded every payment of every year to pick each apartment's latest one.
- Several lists re-sorted rows the query had already ordered.

## What Changes

- `GET /api/admin/apartments` accepts `assignableTo=<userId>` (free apartments plus those held by that user) and also searches the owner email and full labels (`ul. Lipowa 10/2`). The assignment dialog sends its debounced search and `assignableTo` to the API and only pins selected and matching apartments to the top.
- The pending header reads the pending total from the users API (`status=PENDING&limit=1`) and reloads it after user actions.
- The financial summary groups payments by apartment and sums the latest closing balances in the database.
- Unassigned apartments, admin payment years and admin charge periods use the query order directly; the default user order gets an `id` tiebreaker.

## Capabilities

### Modified Capabilities

- `user-management`: assignment dialog availability and the pending count come from the database.
