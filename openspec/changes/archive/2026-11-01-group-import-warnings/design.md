# Design

## Context

Warnings are created in five places in `src/lib/import/`, each with its own message format. The import result card (`src/app/admin/import/import-warnings.tsx`) rendered them as one list. See proposal.md for the motivation.

## Goals / Non-Goals

**Goals:**

- Tell the admin which check produced each warning, without reading the message.

**Non-Goals:**

- Changing the message text of the other checks, apart from the unexplained-difference addition.

## Decisions

**Kind is set where the warning is created.** Each creator sets `kind` as a typed field, and `ImportWarning.kind` is required, so the compiler flags any new warning without a kind. Alternative: classify warnings by matching the message text. Rejected: the messages are Polish prose and change more often than the check names.

**Fixed group order and texts in one constant.** `WARNING_GROUPS` is a record keyed by kind, and its insertion order is the display order. Titles and descriptions live next to it, so the card needs no switch statement. Alternative: sort in the component. Rejected: the order is part of the display contract and belongs in one place.

**Empty groups are dropped by `groupWarnings`.** The card does not render a heading for a kind with no warnings.

**Unexplained difference only when settlements do not explain it.** When the difference equals the settlement lines, the existing "różnica równa wyrównaniom" text stays. Otherwise the message appends the unexplained amount, so the admin sees how much is not explained.

## Risks / Trade-offs

- [A new check forgets its kind] → The field is required in `ImportWarning`, so `tsc` fails.
- [Group descriptions drift from the checks] → Each description is kept next to its kind, and the unit tests check titles and descriptions per kind.

## Migration Plan

No data migration: warnings are produced per import and not stored.
