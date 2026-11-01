# Design

## Context

See proposal.md — Why. The project already runs ESLint flat config with `eslint-config-next`, `simple-import-sort`, `unused-imports`, `import` and `prettier`. Generic plugins cannot express either rule: `no-restricted-syntax` would flag `response.status === 200` for the status rule and cannot see which import a member comes from.

## Goals / Non-Goals

**Goals:**

- Fail the build on a reintroduced raw comparison or raw SQL, with a message that names the fix.
- Keep the rule source small enough to live under the 200-line file limit.

**Non-Goals:**

- Covering `switch` statements; those are presentation mappings in practice.
- Providing autofixes.

## Decisions

**Local plugin instead of `no-restricted-syntax`.**
The access rule needs to distinguish `user.status === AccountStatus.APPROVED` from `response.status === 200`, and to accept bare `status` and `role` variables from destructuring. A selector cannot express "the other operand is this enum member", so the rule walks `BinaryExpression` nodes and unwraps `ChainExpression`, `TSAsExpression` and friends for optional chaining.

**Only `APPROVED` and `ADMIN` are enforced.**
`PENDING` and `REJECTED` drive labels, badges and query filters, and a predicate cannot express all of them. Enforcing just the two values that grant access keeps the rule precise and leaves presentation code alone; the cost is that a `PENDING`-based gate is not caught.

**Allowlist by config `ignores`, not rule options.**
The predicate modules are excluded in the `files`/`ignores` block in `eslint.config.mjs`, which keeps the rule free of configuration and makes the exception visible next to the other lint settings.

**Rules live in plain `.mjs`.**
`eslint.config.mjs` is loaded by Node, so a TypeScript rule module would need a loader. The rule files are covered by `RuleTester` instead, which documents them and guards against regressions.

## Risks / Trade-offs

- **A future enum value that grants access is not covered** → extend the checks table in `prefer-access-helpers.mjs` when a new access-granting value appears.
- **A false positive forces an edit** → the message names the predicate; if the comparison is genuinely not an access check, the file is added to the config allowlist with a comment, which is a deliberate review step.
- **`RuleTester` inside Vitest relies on the global `describe`/`it`** → the Vitest config sets `globals: true`; the rule test file fails loudly if that changes.

## Migration Plan

One deploy. The refactors are behaviour-preserving; the rules only affect `pnpm lint`, which CI already runs.
