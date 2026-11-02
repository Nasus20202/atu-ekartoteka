# Agents Instructions

## Language & Communication

- **Code and commits**: Write all code, comments, and commit messages in English
- **Application language**: The application UI and user-facing content should be in Polish
- **Documentation**: Keep technical documentation in English

## Development Workflow

- **Commits**: Create a commit after every major feature implementation
- **Ask for approval**: Always ask for approval before completing a task and committing the final code
- **Feel free to ask**: If unsure about any requirement or implementation detail, ask for clarification
- **Breaking changes**: Always ask before making changes that modify existing behavior
- **Testing during development**: Verify that everything is working while implementing features
- **Business logic tests**: Write tests for all business logic, put them in the `__tests__` folder next to the implementation files
- **End-to-end tests**: Write E2E tests for all user flows, put them in the `e2e` folder

## Specifications (OpenSpec)

`openspec/` is the source of truth for application behaviour and is kept in the repo.

- **Layout**: `openspec/config.yaml` — project context, rules and the specs index; `openspec/specs/<capability>/spec.md` — current specs; `openspec/changes/<change-name>/` — work in progress (`proposal.md`, `design.md`, `tasks.md`, `specs/<capability>/spec.md` deltas); `openspec/changes/archive/<YYYY-MM-DD>-<change-name>/` — completed changes.
- **Sync every change**: Any change to behaviour, API contracts, data model, tooling or conventions must be reflected in `openspec/` in the same piece of work. A task is not done while the code and the specs disagree.
- **Let the user choose the workflow**: Before implementing, ask whether to follow the full OpenSpec workflow or only sync the specs directly. Never decide this silently, and follow the user's choice for the rest of the task.
- **Full workflow**: use the `openspec-*` skills instead of driving the CLI by hand — `openspec-new-change` / `openspec-propose` / `openspec-ff-change` to create a change, `openspec-continue-change` / `openspec-apply-change` to build it, `openspec-verify-change` to check it, and `openspec-archive-change` / `openspec-bulk-archive-change` / `openspec-sync-specs` to finish it. They create `proposal.md`, `design.md`, `tasks.md` and the spec deltas, then implement, validate and archive so the main specs are updated. Use the full workflow when the user asks for it, or when the change is large, crosses capabilities, is contentious, or alters existing behaviour.
- **Direct sync only**: when the user opts out, edit the affected `openspec/specs/<capability>/spec.md` files as part of the change — no skill and no proposal/design/tasks artifacts or archive entry.
- **Skill version check**: the skills carry `metadata.generatedBy` and are written for a specific OpenSpec release. When the full workflow is chosen, compare it with `openspec --version`; if the installed CLI is newer, tell the user the skills are outdated and suggest running `openspec update` (or reinstalling the skills) before continuing.
- **Format**: `### Requirement:` with `SHALL`, followed by `#### Scenario:` blocks using `GIVEN` / `WHEN` / `THEN`. Reuse existing capability names and wording; ask before adding a new capability folder.
- **Reference**: read the affected spec before coding and keep examples, stories and commands in `openspec/config.yaml` consistent with the code.

## Code Style & Quality

- **UI Framework**: Follow the shadcn/ui style guide for all UI components
- **Formatting**: Code must be formatted with Prettier
- **Linting**: All code must pass ESLint checks without errors
- **Documentation**: Do not add useless docs and comments
- **File size**: Files should not be bigger than 200 lines
- **Testing**: Rememeber about unit/integration/E2E testing
- **Dependencies**: Don't add useless dependencies to the codebase
- **Delete old code**: If something is unused, just delete it
- **Don't use magic numbers/strings**: Use types or constants instead
- **Database queries**: Do all filtering, sorting, pagination (skip/take) and aggregation of database records in the Prisma query, never by loading rows and calling `.filter`/`.sort`/`.slice` in JavaScript
- **No raw SQL**: Do not use `$queryRaw`, `$executeRaw` or their `Unsafe` variants; use the Prisma query API (raw SQL belongs only in migration files)

## Components

- **Location**: Feature components live in `src/components/<feature>/`; `src/components/ui/` contains shadcn/ui primitives only (no feature logic, no data fetching).
- **Naming**: One component per file, `kebab-case.tsx`, named export (`export function UserCard`). Default exports only where Next.js requires them (`page.tsx`, `layout.tsx`, `error.tsx`).
- **Server first**: Components are Server Components by default. Add `'use client'` only to the leaf that needs state, effects, events or browser APIs — keep pages/layouts server-side and pass data down.
- **Props**: Declare a local `interface Props` (or `<ComponentName>Props`). Don't use `React.FC`, `defaultProps`, or untyped prop spreading.
- **Size**: Split components that grow past ~200 lines into smaller parts or move logic into a hook/helper; use `@/` imports (relative imports are lint errors).
- **Classes**: Use `cn()` from `@/lib/utils` for conditional classes; don't build class strings by hand.
- **Animation**: Reuse the shared utilities from `tailwind.config.ts` / `globals.css` (`animate-fade-in`, `animate-slide-in-top`, `animate-slide-in-bottom`, `animate-slide-out-top`, `animate-scale-in`, `animate-view-switch`). Gate animations with `motion-safe:` and disable them with `motion-reduce:animate-none`. `Alert` animates in via `data-state="open"`; when a message must also animate out, use `AnimatedAlert` and let it unmount itself instead of conditionally unmounting the alert.
- **Copy**: UI text in Polish, code, comments and tests in English.

## Hooks

- **Location**: `use-<name>.ts` with a named `use<Name>` export. App-wide hooks go in `src/hooks/`; feature-specific hooks are co-located with their components (e.g. `src/components/users/use-admin-users.ts`).
- **Client boundary**: Add `'use client'` when the hook uses browser APIs, Next.js client hooks, or is imported by a Server Component. Hooks imported only from client components may omit it.
- **Responsibility**: Hooks own state, effects, data fetching, and derived values; components own markup. Don't duplicate fetching/state logic across components — extract it into a hook.
- **API**: Return a typed object (or `as const` tuple) with named fields; avoid positional boolean flags and hidden side effects.
- **Tests**: Every hook has `__tests__/use-<name>.test.ts` next to it; component tests use `__tests__/<component>.test.tsx`; user flows go in `e2e/`.

## Security & Access Management

- **Authorization source of truth**: Roles and account status are resolved from the database on every check (`hasAdminAccess`, `isApprovedAdmin`, `isApprovedAccount`). The JWT carries only `sub` and `mustChangePassword`; never add a role or permission claim to the session token.
- **Access predicates**: Never compare `status === AccountStatus.APPROVED` or `role === UserRole.ADMIN` directly — use `isApprovedStatus`, `isApprovedAccount`, `isAdminRole`, `isApprovedAdmin` (enforced by `local/prefer-access-helpers`). A new status is denied by default; extend the allowlist helper explicitly.
- **API routes**: Every `src/app/api/**/route.ts` calls `requireUser()` or `requireAdmin()` and returns its `response` first (401 anonymous, 403 not allowed). Public routes are an explicit allowlist in `eslint-rules/require-api-auth-guard.mjs` — add one only with a stated reason.
- **Pages**: Protected pages and layouts resolve the session server-side with `auth()` and `redirect('/login')`; `/admin` additionally checks `hasAdminAccess` from the database and redirects to `/dashboard`. Hiding UI is never authorization.
- **Tenant scoping**: Derive the owner from `session.user.id`, never from a request param or body. Scope every query/mutation to the caller's own apartments (or the admin-only path); never fetch by a client-supplied id without an ownership check.
- **Forced password change**: The proxy uses the token's `mustChangePassword` only as a redirect hint; any decision that grants something (e.g. skipping the current-password check) reads it from the database. The proxy (`src/proxy.ts`) redirects all paths except the allowlist in `src/lib/auth/proxy-handler.ts`; extend it deliberately and keep prefix matching segment-aware.
- **Secrets**: Keep secrets server-side in `process.env` only — never `NEXT_PUBLIC_*`, client components, logs, error responses, fixtures or committed files. Never commit `.env`; document new variables in `.env.example`.
- **Passwords and tokens**: Hash passwords with bcrypt using `BCRYPT_COST` and enforce `MIN_PASSWORD_LENGTH` / `password-rules`. Reset and verification tokens are single-use, expiring and consumed in the same transaction; auto-login grants are short-lived, email-bound and compared in constant time.
- **Email identity**: Normalise with `normalizeEmail` on every write and lookup — an address is one identity regardless of case or surrounding whitespace.
- **Bot protection**: Verify Turnstile server-side (`verifyTurnstileToken`) on registration, login and password reset; fail closed on missing tokens or verification errors.
- **Security headers**: `src/proxy.ts` sets CSP/HSTS and `src/lib/security-headers.ts` sets the static headers. Don't loosen them (no `unsafe-eval` in production, no new external origins) without a security review.
- **Inputs and errors**: Validate request bodies before use; return Polish messages that don't reveal whether an email exists or which credential was wrong; log denials and failures through `createLogger` without passwords, tokens or secrets.
- **Spec sync**: Behaviour changes to access control must be reflected in `openspec/specs/authentication` and covered by route or page tests.

## Best Practices

- Test incrementally as you build
- Maintain consistency with existing code patterns
- Prioritize user experience and accessibility
- Keep components modular and reusable
- Follow conventional commit message rules

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
