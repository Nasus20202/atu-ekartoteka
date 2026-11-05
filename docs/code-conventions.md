# Code conventions

What reviewers and the linter expect. Items marked **(lint)** fail `pnpm lint`;
the rest are checked in review. The same rules, phrased for coding agents, are
in [`AGENTS.md`](../AGENTS.md).

## Language

- Code, comments, tests, commits and technical docs are in English.
- Everything a user reads in the app is in Polish.

## General

- Prettier formatting: single quotes, semicolons, 80 columns, 2 spaces **(lint)**.
- Imports use the `@/` alias. Relative imports are an error **(lint)**.
- Keep files under about 200 lines. Split by responsibility, not by line count.
- No magic numbers or strings. Name them as constants or types.
- Delete unused code instead of commenting it out. Do not add a dependency for
  something a few lines can do.
- Comments say why, not what. Do not add comments or docs that restate the code.
- No toast library: feedback goes in an `Alert` or inline state.

## Components

- Feature components go in `src/components/<feature>/`. `src/components/ui/` is
  for shadcn/ui primitives only: no data fetching, no feature logic.
- One component per file, `kebab-case.tsx`, named export. Default exports only
  where Next.js requires them (`page.tsx`, `layout.tsx`, `error.tsx`).
- Server components by default. Add `'use client'` to the smallest leaf that
  needs state, effects or browser APIs, and pass data down from the server.
- Props are a local `interface Props` (or `<Name>Props`). No `React.FC`, no
  `defaultProps`.
- Conditional classes use `cn()` from `@/lib/utils`.
- Animations reuse the utilities in `tailwind.config.ts` and `globals.css`,
  are wrapped in `motion-safe:`, and are turned off with
  `motion-reduce:animate-none`.
- Follow the shadcn/ui style. Design tokens and accessibility baseline are in
  `openspec/specs/visual-design/spec.md`.

## Hooks

- A hook lives in `use-<name>.ts` and has a named `use<Name>` export. App-wide
  hooks go in `src/hooks/`; feature hooks sit next to their component.
- A hook owns state, effects and fetching; a component owns markup. Do not
  repeat fetching logic across components.
- Return a typed object with named fields rather than a tuple of booleans.
- Reads that a client component makes itself use SWR with the shared options
  from `src/lib/swr`.

## Database

- Filter, sort, paginate and aggregate in the Prisma query. Do not load rows and
  then `.filter`, `.sort` or `.slice` them in JavaScript.
- No `$queryRaw` / `$executeRaw` **(lint)**. Raw SQL is for migration files.
- Money is `Decimal`. Use the helpers in `src/lib/utils/decimal`, not floats.
- Do not read `legacy*` columns outside the import and payment queries **(lint)**;
  see [Architecture](architecture.md#the-data-model).

## Security and access

These are the rules that protect residents' data. Do not work around them.

- **Role and status come from the database**, on every check. The session token
  holds only the user ID and `mustChangePassword`; never add a role or
  permission to it.
- **Use the access helpers** (`isApprovedAdmin`, `isApprovedAccount`,
  `isAdminRole`, `isApprovedStatus`). Comparing `role` or `status` directly is
  an error **(lint)**, so a new status is denied by default.
- **Every API route** starts with `requireUser()` or `requireAdmin()` and returns
  its `response` **(lint)**. A public route says why in a file-level
  `eslint-disable local/require-api-auth-guard -- <reason>` comment.
- **Every `'use server'` module** starts with `requireUserAction()` or
  `requireAdminAction()` **(lint)**, takes explicit, validated arguments, and
  has no inline actions that capture variables. Public actions (registration,
  password reset and similar) opt out with a reasoned
  `eslint-disable local/require-action-auth-guard` comment.
- **Scope by owner.** Take the user from `session.user.id`, never from the
  request. Every tenant query is limited to the caller's own apartments, and an
  object fetched by a client-supplied ID needs an ownership check.
- **Hiding UI is not authorization.** Check on the server.
- **Secrets** live in server-side `process.env`: not in `NEXT_PUBLIC_*`, client
  code, logs, error responses, fixtures or commits. Document each new variable in
  `.env.example`.
- **Passwords** are hashed with bcrypt at `BCRYPT_COST` and checked against
  `password-rules`. Reset and verification tokens are single-use, expire, and
  are consumed in the same transaction that uses them.
- **Emails** go through `normalizeEmail` on every write and lookup, so one
  address is one identity regardless of case or spaces.
- **Bot protection:** register, login and password reset verify Turnstile
  server-side and refuse when the check cannot be completed.
- **Messages to users** are in Polish and must not reveal whether an account
  exists or which credential was wrong. Log failures through `createLogger`,
  never with passwords, tokens or secrets.
- **Security headers** are set in `src/proxy.ts` and `src/lib/security-headers.ts`.
  Do not loosen the CSP or add external origins without a security review.

## Tests

- Business logic gets unit tests in a `__tests__` folder next to the code.
  Every hook has `__tests__/use-<name>.test.ts`, every component
  `__tests__/<component>.test.tsx`.
- Every user flow gets an end-to-end test in `e2e/`.
- Coverage thresholds are 95% for lines, branches, functions and statements.
- E2E database helpers load SQL from `e2e/test-data/seed/*.sql` through
  `loadSql`; do not inline SQL in the helpers.

More in [Testing](testing.md).

## Specs

A change to behaviour, API contracts, the data model, tooling or conventions
updates `openspec/` in the same pull request. See
[Development](development.md#specifications).
