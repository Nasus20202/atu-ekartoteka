# Tasks

## 1. Comparison helper

- [x] 1.1 Add `DB_DECIMAL_SCALE` and `decimalEqualsStored` to `src/lib/utils/decimal.ts`. Unit tests must cover:
  - equal values
  - `-132.580542` vs `-132.5805` (equal)
  - `10.123650` vs `10.1237` (equal, half away from zero)
  - `-10.123650` vs `-10.1237` (equal)
  - `10.1236` vs `10.1234` (not equal)
  - Prisma Decimal, string and number inputs

## 2. Importers

- [x] 2.1 Use `decimalEqualsStored` in `hasChargeChanged` (`charges.ts`). Extend `importers/__tests__/charges.test.ts` with two cases:
  - a 6-decimal quantity whose stored value is already rounded is not updated, and `stats.updated` stays 0
  - a change visible at 4 decimal places is updated
- [x] 2.2 Use `decimalEqualsStored` in `hasNotificationChanged` (`notifications.ts`). Add the same two test cases to `notifications.test.ts`.
- [x] 2.3 Use `decimalEqualsStored` in the payment comparison (`payment-data.ts`), covering every monthly field, the opening and closing balances, and the opening debt and surplus. Add the same two test cases to `payments.test.ts`.

## 3. Regression E2E

- [x] 3.1 Add a fixture `nal_czynsz.txt` with at least one quantity that has more than 4 decimal places. In `e2e/admin/import-decimal-precision.spec.ts`, import the same HOA files twice and assert that the second run shows `0` for `Zaktualizowanych` under `Naliczenia`. Verify with `pnpm playwright test e2e/admin/import-decimal-precision.spec.ts`.

## 4. Integration checks

- [x] 4.1 Run `pnpm lint`, `pnpm vitest --run` and `pnpm playwright test e2e/admin`. Manually re-import the TEST HOA files twice and confirm that the second run reports 0 charges updated.

## Workflow follow-up

- Ask the user for approval before the final commit (AGENTS.md).
- Archive the change after review with `/opsx:archive`.
