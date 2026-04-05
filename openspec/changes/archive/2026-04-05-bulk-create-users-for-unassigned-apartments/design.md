# Design: Bulk Create Users for Unassigned Apartments

## Database changes

### New field: `User.mustChangePassword`

Add a boolean field to the `User` model:

```prisma
mustChangePassword Boolean @default(false)
```

- Set to `true` when a user is created via the bulk-create flow.
- Set to `false` once the user successfully changes their password.
- Included in the JWT session token (alongside `role`, `status`, `emailVerified`) so middleware can gate access.

No migration of existing users is needed; the default is `false`.

---

## API

### `GET /api/admin/unassigned-apartments`

Returns all apartments that:

- Have no `userId` (no account linked), AND
- Have a non-empty `email` field stored from import.

Response shape (grouped by HOA):

```ts
{
  hoas: Array<{
    hoaId: string;
    hoaName: string;
    apartments: Array<{
      id: string;
      number: string;
      building: string | null;
      owner: string | null;
      email: string;
    }>;
  }>;
}
```

Admin-only (returns 401 for non-admins). Sorted: HOAs alphabetically by name, apartments within each HOA by building then number.

---

### `POST /api/admin/users/bulk-create`

Request body:

```ts
{
  apartmentIds: string[];  // IDs of apartments to create users for
}
```

Processing logic (all in a single DB transaction):

1. Fetch the specified apartments, verifying they belong to no user and have an email.
2. Deduplicate by email — if two selected apartments share an email, create one account and assign both apartments.
3. For each unique email:
   a. If a `User` with that email already exists → skip (include in `skipped` results).
   b. Generate a cryptographically random temporary password (12 chars, alphanumeric).
   c. Hash the password with bcrypt (cost 10).
   d. Create the `User` with:
   - `role: TENANT`
   - `status: APPROVED`
   - `emailVerified: true`
   - `mustChangePassword: true`
   - `authMethod: CREDENTIALS`
     e. Assign all matching apartments to the new user.
     f. Send an activation email with the temporary password (fire-and-forget; email failure does not roll back).
4. Return a summary:

```ts
{
  created: number;
  skipped: number; // emails that already had an account
  errors: number;
}
```

Admin-only (returns 401 for non-admins).

---

## Email: Activation email

New template: `account-activation` (HTML + TXT).

Variables:

- `NAME` — owner name (optional)
- `TEMP_PASSWORD` — the plain-text temporary password (shown once)
- `LOGIN_URL` — app login URL

Subject (Polish): `"Twoje konto zostało utworzone – zmień hasło przy pierwszym logowaniu"`

New `EmailService` method: `sendAccountActivationEmail(to, tempPassword, name?)`.
New `EmailType` value: `'account_activation'`.

---

## Middleware: forced password change

Extend the existing Next.js middleware (or `auth` session callbacks) to intercept requests from users where `mustChangePassword === true`.

- After login, if `session.user.mustChangePassword` is `true`, redirect to `/change-password`.
- The `/change-password` page uses the existing profile password-change API (`PATCH /api/user/profile`).
- On successful password change, set `mustChangePassword: false` in the DB and refresh the session.
- All routes except `/change-password`, `/api/user/profile`, `/api/auth/*`, and public assets are blocked for these users.

The `mustChangePassword` flag must be included in the JWT callback (alongside `role`, `status`, `emailVerified`).

---

## Frontend

### Page: `/admin/users/bulk-create`

- Linked from the existing admin users page (e.g., "Utwórz konta masowo" button).
- Fetches `GET /api/admin/unassigned-apartments` on mount.
- Renders a list grouped by HOA:
  - HOA header row with a "select all in HOA" checkbox.
  - One row per apartment showing: number, building, owner name, email.
  - Individual row checkbox.
- A "Utwórz konta" confirm button (disabled when nothing selected).
- On confirm: calls `POST /api/admin/users/bulk-create` with selected apartment IDs, shows a toast with the result summary, and refreshes the list.
- Empty state: message when all apartments already have accounts.

### Page: `/change-password`

- Simple form: new password + confirm new password fields.
- On submit: calls `PATCH /api/user/profile` with `newPassword`.
- On success: refreshes session and redirects to `/dashboard`.
- No "skip" option — cannot be dismissed.

---

## Security considerations

- Temporary password is generated server-side with `crypto.randomBytes`; never stored in plain text.
- The activation email is the only place the temporary password is exposed; it is transmitted over SMTP (TLS).
- `mustChangePassword` is enforced at the middleware layer (not just UI), so API endpoints are also gated.
- Bulk-create is admin-only; apartment IDs are re-validated server-side to prevent ID injection.

---

## Affected specs

- `openspec/specs/user-management/spec.md` — add bulk creation and `mustChangePassword` scenarios.
- `openspec/specs/authentication/spec.md` — add forced password change on first login scenario.
- `openspec/specs/apartment-management/spec.md` — add unassigned apartments listing scenario.
- `openspec/specs/testing/spec.md` — no structural change needed; new code follows existing conventions.
