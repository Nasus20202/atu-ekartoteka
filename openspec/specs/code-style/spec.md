# Capability: Code Style

## Purpose

Defines the code authoring conventions enforced across all TypeScript and TSX source files. These rules exist to keep the codebase consistent, readable, and maintainable regardless of who writes a given piece of code.

---

## Requirements

### Requirement: Language

All code, comments, and commit messages SHALL be written in English. User-facing content (UI labels, error messages, email copy) SHALL be written in Polish.

#### Scenario: New source file

- **GIVEN** a developer adds a new source file
- **WHEN** they write code, variable names, and comments
- **THEN** all identifiers and comments are in English; any string literals shown to the user are in Polish

---

### Requirement: TypeScript strictness

The project SHALL use TypeScript in strict mode with no implicit `any`.

#### Scenario: Type errors

- **GIVEN** any TypeScript source file
- **WHEN** `tsc --noEmit` runs
- **THEN** it exits with zero errors; type assertions (`as`) are only used when the type system cannot infer correctly and the cast is safe

#### Scenario: Explicit `any` in tests

- **GIVEN** a test file under `__tests__/` or matching `*.test.ts(x)`
- **WHEN** a mock requires `any` to satisfy the type checker
- **THEN** `any` is permitted; `@typescript-eslint/no-explicit-any` is disabled for test files

---

### Requirement: File size limit

No source file SHALL exceed 200 lines.

#### Scenario: File grows beyond 200 lines

- **GIVEN** an existing file approaching 200 lines
- **WHEN** new logic needs to be added
- **THEN** the file is split into focused modules before the new logic is added; each module has a single clear responsibility

---

### Requirement: No magic values

Constants and enum members SHALL be used instead of inline literal strings or numbers that carry domain meaning.

#### Scenario: Domain string used in logic

- **GIVEN** a value like a role name, account status, or route path that appears in conditional logic
- **WHEN** a developer writes or reviews the code
- **THEN** the value is referenced via a named constant or enum (e.g., `UserRole.ADMIN`, `AccountStatus.APPROVED`, `CHANGE_PASSWORD_PATH`)

---

### Requirement: Import style

All imports SHALL use the `@/` path alias. Relative imports are forbidden outside of `e2e/`.

#### Scenario: Importing a shared utility

- **GIVEN** a file at `src/app/admin/users/page.tsx` that needs a utility from `src/lib/shared/utils`
- **WHEN** the developer writes the import
- **THEN** they write `import { ... } from '@/lib/shared/utils'`; writing `import { ... } from '../../../lib/utils'` is a lint error

#### Scenario: Import order

- **GIVEN** a file with multiple import statements
- **WHEN** ESLint runs
- **THEN** `simple-import-sort` enforces alphabetical order within each group; violations are auto-fixed on pre-commit

---

### Requirement: No unused code

Unused imports, variables, and exported symbols SHALL be removed.

#### Scenario: Unused import

- **GIVEN** an import that is no longer referenced in the file
- **WHEN** ESLint runs
- **THEN** `unused-imports` reports and auto-removes it; the commit is blocked if unfixable unused imports remain

#### Scenario: Dead feature code

- **GIVEN** a feature or utility that is no longer used anywhere
- **WHEN** a developer identifies it during review or refactoring
- **THEN** it is deleted rather than commented out or left in place

---

### Requirement: No duplicate imports

Multiple imports from the same module SHALL be merged into a single import statement.

#### Scenario: Duplicate module import

- **GIVEN** two `import` statements referencing the same module path
- **WHEN** ESLint runs
- **THEN** `import/no-duplicates` reports an error; they are merged before commit

---

### Requirement: Naming conventions

Identifiers SHALL follow TypeScript community conventions.

#### Scenario: Component and type names

- **GIVEN** a React component, interface, type alias, or enum definition
- **WHEN** a developer names it
- **THEN** it uses PascalCase (e.g., `UserCard`, `AccountStatus`, `AuthMethod`)

#### Scenario: Variables, functions, and properties

- **GIVEN** a variable, function, or object property
- **WHEN** a developer names it
- **THEN** it uses camelCase (e.g., `mustChangePassword`, `buildProviders`, `findUnique`)

#### Scenario: Constants

- **GIVEN** a module-level constant that holds a fixed value (not reassigned)
- **WHEN** a developer names it
- **THEN** it uses SCREAMING_SNAKE_CASE for primitive constants (e.g., `CHANGE_PASSWORD_PATH`, `MAX_RETRIES`) or camelCase/PascalCase for object or function constants

---

### Requirement: No documentation noise

Source files SHALL not contain comments that merely restate what the code does.

#### Scenario: Obvious comment

- **GIVEN** a function or block of code whose purpose is self-evident from its name and structure
- **WHEN** a developer considers adding a comment
- **THEN** the comment is omitted; comments are reserved for non-obvious decisions, external constraints, or intentional workarounds

---

### Requirement: Named DTOs at Frontend Boundaries

Data passed from server-side database or query composition into client components, other frontend-only rendering boundaries, or internal JSON API responses consumed by the frontend SHALL use named DTO types and dedicated mapping functions.

#### Scenario: Server page passes data to client component

- **WHEN** a server page or server component prepares database-backed data for a client component
- **THEN** it maps that data through a dedicated DTO mapper
- **AND** the receiving component props are typed with a named DTO instead of a database entity type or an unnamed serialized object shape

#### Scenario: Frontend-safe conversion is needed for Decimal or Date fields

- **WHEN** a boundary requires conversion of `Decimal`, `Date`, or other non-plain values into frontend-safe props
- **THEN** the conversion happens in a dedicated DTO mapper module
- **AND** the module naming reflects the DTO contract rather than a generic `serialize*` helper

#### Scenario: Query modules remain database-focused

- **WHEN** a feature needs both database-shaped records and frontend-safe props
- **THEN** the query module continues to return database-oriented data
- **AND** the DTO mapping is applied in the caller or a dedicated boundary mapper rather than inside the query itself

#### Scenario: Route handler returns database-backed JSON

- **WHEN** an internal route handler returns user, apartment, charge, payment, or similar domain data for frontend consumption
- **THEN** it maps the response through a named DTO helper before calling `NextResponse.json`
- **AND** the handler does not expose raw Prisma-selected record shapes as the route contract

---

### Requirement: Vertical slices by domain

`src/lib/` SHALL contain only folders. Each domain SHALL own a slice `src/lib/<domain>/` holding its pure rules, its domain models in `types/<entity>.ts`, its DTO types and mappers in `dto/<entity>-dto.ts`, and where it has such code its `queries/` (reads), `mutations/` (writes) and `use-cases/` (orchestration). Shared infrastructure SHALL live in `src/lib/platform/`, the Next.js and Auth.js edge in `src/lib/framework/`, and pure code shared across domains in `src/lib/shared/`. A slice MAY import another slice's queries, mutations, types or use cases; the framework and database boundaries below still apply.

#### Directory structure

```
src/lib/
  admin/        queries/ (dashboard counts across domains)
  apartments/   types/apartment, dto/apartment-dto, queries/ mutations/
  auth/         types/account, types/turnstile, rules/, gateways/turnstile,
                queries/ mutations/ use-cases/
  charges/      types/charge, dto/charge-dto, queries/
  cron/         rules/constants, runtime/ (scheduler, run-coordinator), jobs/,
                mutations/, use-cases/initialize-cron-jobs
  framework/    auth/, request-now, rsc-cache, tenant-history, security-headers, list-view-mode-server
  hoa/          types/hoa, dto/hoa-dto, queries/ mutations/
  import/       rules/, parsers/, validation/, pipeline/, importers/, types/, use-cases/
  payments/     types/payment, types/monthly-charge-sums, dto/payment-dto, queries/
  platform/     logging/ database/ opentelemetry/ swr/ pdf/ email/
  privacy/      rules/ (markdown, placeholders), template/
  settings/     rules/, queries/ mutations/
  shared/       iso-string.ts, use-case-result.ts, list-view-mode.ts, document-title.ts, utils/
  users/        types/user, dto/user-dto, queries/ mutations/ use-cases/
```

### Requirement: Slice layers

A domain slice SHALL hold only folders, each one of `types/`, `dto/`, `rules/`, `parsers/`, `validation/`, `template/`, `gateways/`, `queries/`, `mutations/`, `importers/`, `pipeline/`, `runtime/`, `jobs/` or `use-cases/`. A folder SHALL import only the folders its layer allows, as listed in `eslint-rules/slice-layers.mjs`. Pure folders (`types/`, `dto/`, `rules/`, `parsers/`, `validation/`, `template/`) SHALL NOT import `src/lib/platform/` except logging. Domain code SHALL NOT import `src/lib/framework/`. Components SHALL NOT import `use-cases/`, `pipeline/`, `importers/`, `runtime/`, `jobs/` or `gateways/`. Shared code in `src/lib/shared/` SHALL import only domain types. ESLint SHALL enforce these rules (`local/slice-structure`, `local/slice-imports`).

#### Scenario: Model importing a use case

- **GIVEN** a file in `types/` or `dto/`
- **WHEN** it imports from a `use-cases/` folder
- **THEN** lint fails; the behaviour moves to `rules/` and the use case imports the model

#### Scenario: Loose file at a slice root

- **GIVEN** a new file placed directly in `src/lib/<domain>/`
- **WHEN** lint runs
- **THEN** it fails, and the file moves into the folder of its layer

### Requirement: One type file per entity

Domain models SHALL live in `src/lib/<domain>/types/<entity>.ts` and DTOs in `src/lib/<domain>/dto/<entity>-dto.ts`, each file grouping the related types of one entity. A slice SHALL NOT have a `types.ts` at its root, and no `index.ts` barrel SHALL re-export types. A single type SHALL NOT get a file of its own. Importers SHALL name the file that owns each symbol. A file SHALL be split only when it exceeds 200 lines or its types have different owners. The import pipeline's types SHALL follow the same rule in `src/lib/import/types/`.

#### Scenario: New domain type

- **GIVEN** a slice needs a new model or DTO
- **WHEN** a developer adds the type
- **THEN** it is added to the existing `types/<entity>.ts` or `dto/<entity>-dto.ts` of that entity, or a new file named after the entity is created when none exists, and importers import it from that file

### Requirement: Data access via queries and mutations

All Prisma database operations SHALL be encapsulated in dedicated files under `src/lib/<domain>/queries/` (reads) and `src/lib/<domain>/mutations/` (writes). The database client (`prisma` from `src/lib/platform/database/prisma`) SHALL be imported only by those folders and by the infrastructure that owns it: `src/lib/platform/database/`, `src/lib/import/` (multi-step transactions, which receive a transaction client `tx` from their callers), `src/lib/cron/`, `src/lib/platform/opentelemetry/` and the health route `src/app/api/health/`. Pages, components, API routes and Server Actions SHALL NOT import it; ESLint enforces this. Type-only and value imports of Prisma types or `Prisma.Decimal` are not database access and are not restricted.

#### Scenario: New read operation

- **GIVEN** a feature needs to read data from the database
- **WHEN** a developer writes the query
- **THEN** it is placed in `src/lib/<domain>/queries/<verb>-<subject>.ts` and exported as a plain function that imports no React API; request-scoped memoisation is added in `src/lib/framework/rsc-cache.ts` (see the next scenario)

#### Scenario: Request-scoped memoisation for a server component

- **GIVEN** a query that more than one entry point (a guard, a loader or a component) reads in the same request
- **WHEN** the memoised variant is needed
- **THEN** `src/lib/framework/rsc-cache.ts` exports it once (e.g., `export const findUserByIdCached = cache(findUserById)`), and every caller imports that same export; React's `cache()` only shares results between callers that call the same memoised function, so wrapping the query again in a component would not dedupe
- **AND** a read that one entry point reaches, or that sits inside an already memoised loader, is called directly with no wrapper

#### Scenario: New write operation

- **GIVEN** a feature needs to create, update, or delete data
- **WHEN** a developer writes the mutation
- **THEN** it is placed in `src/lib/<domain>/mutations/<verb>-<subject>.ts`; the function is exported as a plain function with no caching

#### Scenario: Server component vs. API route usage

- **GIVEN** a query function that is called from both a server component and an API route
- **WHEN** the call sites import the function
- **THEN** the server component imports the `Cached` variant from `src/lib/framework/rsc-cache.ts` (e.g., `findUserByIdCached`) and the API route imports the plain variant from the query module (e.g., `findUserById`)

#### Scenario: Accidental direct prisma import

- **GIVEN** a developer adds a database call directly in an API route, page, or utility that is not a query/mutation file
- **WHEN** the code is reviewed
- **THEN** the call is extracted to the appropriate `src/lib/<domain>/queries/` or `src/lib/<domain>/mutations/` file and imported from there

---

### Requirement: Framework boundary

Domain logic SHALL NOT depend on Next.js, React or Auth.js. Those APIs only exist inside a request or a render, so importing them into the domain would tie it to the current runtime. Framework glue SHALL live in `src/lib/framework/` (or `src/app/`), and ESLint SHALL enforce both rules.

#### Scenario: Domain module imports the framework

- **GIVEN** a domain module under `src/lib/` outside `src/lib/framework/` and `src/lib/platform/email/`
- **WHEN** it imports `next`, `next/*`, `next-auth`, `next-auth/*`, `react` or `react-dom`
- **THEN** ESLint reports `no-restricted-imports`; the framework call moves to `src/lib/framework/` and the domain function takes the value as an argument or returns a plain result

#### Scenario: Module needs the request or the render scope

- **GIVEN** a module needs the request date, the request-scoped read cache, the list view cookie or the session
- **WHEN** it is written
- **THEN** it is placed in `src/lib/framework/` and imported from there by pages, components and actions

#### Scenario: Write reached from a component

- **GIVEN** a file under `src/app/` or `src/components/`
- **WHEN** it imports from `@/lib/*/mutations/*`
- **THEN** ESLint reports an error; writes go through a Server Action in `src/actions/` or the documented admin import route, while reads may still use `@/lib/*/queries/*`

---

### Requirement: Use cases live in use-case modules

A Server Action SHALL stay thin: it applies the guard, coerces untrusted input, calls a use case and maps the outcome to the browser shape. The use case SHALL live in its domain's `src/lib/<domain>/use-cases/` folder as a plain function over typed arguments that returns a `UseCaseResult`, so it runs without the Next.js runtime.

#### Scenario: Action with orchestration

- **GIVEN** a Server Action that hashes a password, checks for duplicates, writes, and notifies
- **WHEN** it is written or changed
- **THEN** the orchestration is in `src/lib/<domain>/use-cases/<use-case>.ts` (for example `src/lib/auth/use-cases/register-account.ts`), and the action keeps the guard, the input coercion and `fromUseCaseResult`

#### Scenario: Service reports a failure

- **GIVEN** a service whose call can fail
- **WHEN** it returns the failure
- **THEN** it uses `invalidResult` or `failedResult` from `src/lib/shared/use-case-result.ts` and does not import from `src/actions/`

---

### Requirement: Conventional commits

All git commit messages SHALL follow the Conventional Commits specification.

#### Scenario: New feature commit

- **GIVEN** a commit that introduces new user-visible functionality
- **WHEN** the commit message is written
- **THEN** it starts with `feat:` followed by a concise present-tense description (e.g., `feat: add bulk user creation for unassigned apartments`)

#### Scenario: Bug fix commit

- **GIVEN** a commit that corrects incorrect behaviour
- **WHEN** the commit message is written
- **THEN** it starts with `fix:` (e.g., `fix: prevent redirect loop on change-password page`)

#### Scenario: Other commit types

- **GIVEN** a non-feature, non-fix commit
- **WHEN** the commit message is written
- **THEN** it uses one of: `refactor:`, `test:`, `chore:`, `docs:`, `style:`, `perf:`, `ci:`

---

### Requirement: Access predicate usage

Account status and role decisions SHALL go through the shared predicates in `src/lib/auth/`. Comparing a `status` or `role` value against `AccountStatus.APPROVED` or `UserRole.ADMIN` outside those modules SHALL be a lint error.

#### Scenario: Direct admin comparison

- **GIVEN** a source file outside `src/lib/auth/`
- **WHEN** it compares a `role` value with `UserRole.ADMIN`
- **THEN** ESLint reports `local/prefer-access-helpers` and the build fails

#### Scenario: Direct approval comparison

- **GIVEN** a source file outside `src/lib/auth/`
- **WHEN** it compares a `status` value with `AccountStatus.APPROVED`
- **THEN** ESLint reports `local/prefer-access-helpers` and names the predicate to use

#### Scenario: Predicate modules

- **GIVEN** the modules that define the predicates
- **WHEN** they compare against the enum members
- **THEN** ESLint accepts the comparison, so the rule has exactly one home

#### Scenario: Other status values

- **GIVEN** presentation code that maps `PENDING` or `REJECTED` to a label
- **WHEN** it compares against those enum members
- **THEN** ESLint does not report an error

---

### Requirement: No raw SQL

Application code SHALL NOT use Prisma raw SQL. Raw SQL is allowed only in migration files.

#### Scenario: Raw query in an API route

- **GIVEN** a source file under `src/`
- **WHEN** it calls `$queryRaw`, `$queryRawUnsafe`, `$queryRawTyped`, `$executeRaw` or `$executeRawUnsafe`
- **THEN** ESLint reports `local/no-raw-sql` and the build fails

#### Scenario: Query API

- **GIVEN** a database call written with the Prisma query API
- **WHEN** ESLint runs
- **THEN** no error is reported
