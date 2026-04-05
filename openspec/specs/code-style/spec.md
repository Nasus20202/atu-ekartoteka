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

- **GIVEN** a file at `src/app/admin/users/page.tsx` that needs a utility from `src/lib/utils.ts`
- **WHEN** the developer writes the import
- **THEN** they write `import { ... } from '@/lib/utils'`; writing `import { ... } from '../../../lib/utils'` is a lint error

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
