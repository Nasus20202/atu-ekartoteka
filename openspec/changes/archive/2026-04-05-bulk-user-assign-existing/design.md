## Context

The bulk-create page (`/admin/users/bulk-create`) currently shows only apartments that have no assigned user AND have a non-null email. It creates new accounts for those apartments and silently skips any apartment whose email already belongs to a registered user.

This means that when a tenant already has an account (e.g., registered independently or via OAuth) but their apartment still has `userId IS NULL`, the admin has no bulk path to link them — they must manually open each apartment record.

The new "assign-existing" mode mirrors the existing flow but targets apartments whose email matches a user that already exists, and assigns that user to the apartment instead of creating a new account.

## Goals / Non-Goals

**Goals:**

- Add a second tab/mode on the bulk-create page for "assign existing users to apartments".
- New `GET` variant (or query param on existing endpoint) that returns apartments whose email matches an existing user but are still unassigned (`userId IS NULL`).
- New `POST /api/admin/users/bulk-assign` endpoint: takes `{ apartmentIds: string[] }`, looks up each apartment's email, finds the matching user, and sets `apartment.userId`.
- Success/error feedback consistent with the existing bulk-create result pattern (`{ assigned, skipped, errors }`).
- Unit tests for the new API route and updated UI.
- E2E test for the assign-existing flow.

**Non-Goals:**

- Sending any email during assign — the user already has an account; no notification is needed (this can be a future enhancement).
- Creating accounts in the assign-existing tab.
- Changing the existing create-new flow in any way.
- Handling apartments that have no email on file.

## Decisions

### 1. Separate API endpoint vs. query param on existing endpoint

**Decision**: New dedicated endpoint `POST /api/admin/users/bulk-assign`.

**Rationale**: The existing `POST /api/admin/users/bulk-create` handles account creation with password generation, bcrypt hashing, and email dispatch. Assign-existing does none of that — it only updates `apartment.userId`. Mixing the two in one handler would require awkward branching and make tests harder to read. A dedicated endpoint is consistent with how the codebase structures admin API routes (one action per route file).

**Alternative considered**: A `mode` query param on the existing endpoint. Rejected because it couples two conceptually different actions into one handler.

### 2. Separate GET endpoint vs. query param on `/api/admin/unassigned-apartments`

**Decision**: Reuse `/api/admin/unassigned-apartments` with a new optional query param `?mode=assignable`.

**Rationale**: The base query (apartments where `userId IS NULL`) is the same for both modes; only the email-matching condition differs. A query param avoids duplicating route boilerplate. The default (`mode=creatable`) preserves existing behaviour exactly.

- `mode=creatable` (default): apartments with `userId IS NULL` and email NOT in users table — current behaviour.
- `mode=assignable`: apartments with `userId IS NULL` and email IS in users table (exact match).

### 3. UI — tab switcher placement

**Decision**: Use shadcn/ui `Tabs` component at the top of the bulk-create page with two tabs: "Utwórz konta" (existing) and "Przypisz istniejące" (new).

**Rationale**: Both modes share the same page context (grouped HOA cards with checkboxes); tabs clearly separate the intent while reusing the card layout. Consistent with shadcn/ui conventions used elsewhere in the admin UI.

### 4. Result shape for bulk-assign

```ts
// Request
{ apartmentIds: string[] }

// Response
{
  assigned: number;  // apartments successfully linked to existing users
  skipped: number;   // apartments where no matching user was found, or already assigned
  errors: number;    // unexpected DB errors
}
```

Mirrors `BulkCreateResult` shape for UI consistency.

### 5. No email notification on assign

Assigning an apartment to an existing account is an admin data-correction action. The user already has login credentials and can see their dashboard. Sending an unsolicited email may be confusing. This can be revisited as a separate notification feature.

### 6. DB migration

No migration required. The `Apartment.userId` foreign key already exists and is nullable. The new endpoint only writes to that existing column.

### 7. Reuse `HoaCard` component

The card rendering component is already split out as a local sub-component in `page.tsx`. Both tabs will use the same card layout but with different data source and submit handler. To stay under the 200-line file limit, the shared `HoaCard` will be extracted to its own file: `src/app/admin/users/bulk-create/HoaCard.tsx`.

## Risks / Trade-offs

- **Race condition on assign**: Between the admin selecting apartments and submitting, a user could self-register with that email. Mitigation: the API re-checks that the apartment is still unassigned and that the user exists at the time of write, using a Prisma transaction. Apartments that changed state in the meantime are counted as `skipped`.
- **Email collision across HOAs**: If two unassigned apartments share the same email, the assign endpoint assigns both to the same existing user in one transaction (same deduplication logic as bulk-create). This is the correct and expected behaviour.
- **Extracting HoaCard increases file count**: Minor. Keeps both files within the 200-line limit, which is a hard project convention.
