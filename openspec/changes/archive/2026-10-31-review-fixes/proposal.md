# Proposal

## Why

A review of the `feat/client-feedback-2026-10` branch found behaviour that differs from what admins and tenants expect:

- The `Udział` sort orders by numerator, then denominator, so 1/2 (50%) sorts before 30/100 (30%).
- Notice PDFs take their date from UTC, so files downloaded shortly after midnight carry the previous day, and apartments with the same label in two HOAs are merged onto one page.
- A malformed settings request body returns 500 instead of 400.
- When the previous month falls outside the tenant history window, the spec did not say what the dashboard comparison shows.
- E2E helpers added on the branch run inline SQL instead of loading it from seed files.

## What Changes

- Apartments get a database-generated `shareRatio` column; the `Udział` sort and every share display use it instead of computing numerator ÷ denominator in each view, which had drifted into different rules for unknown and zero shares (and printed `Brak%` / `-%`).
- PDF generation dates and the notice filename use the browser's local date; notice pages are grouped by HOA and label.
- The settings API answers a malformed JSON body with 400.
- The spec states that a previous month outside the window is not shown on the dashboard (current behaviour, kept on purpose).
- E2E SQL for scroll and name-sort tests moves to `e2e/test-data/seed/`.

Code-only fixes from the same review, with no spec change: the assignment dialog no longer shows the previous user's apartments while loading, `refresh()` of infinite lists cancels a page still loading, and the HOA financial summary runs its independent queries in parallel with fewer bind parameters.

## Capabilities

### Modified Capabilities

- `apartment-management`: share sort by ratio; displayed share comes from the database.
- `charges-and-payments`: share percentage formatted from the database ratio with a decimal comma (`5,75%`, previously shown as `5.75%` despite the spec); zero share shown as `0%`.
- `tenant-history-window`: previous month outside the window; malformed settings body.
- `pdf-export`: local generation date; same label in two HOAs.
- `testing`: E2E SQL kept in files.

## Non-goals

- Changing how import files are routed by name prefix.
- Moving inline SQL out of E2E helpers that predate this branch.
