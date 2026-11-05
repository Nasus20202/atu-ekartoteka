# Tasks

## 1. Schema and claim mutation

- [ ] 1.1 Add `CronRun` to `prisma/schema.prisma` and a migration creating the table with `UNIQUE (jobName, slot)` and an index on `slot`; verify `pnpm db:deploy` and `pnpm db:generate` succeed
- [ ] 1.2 Add `src/lib/mutations/cron/claim-cron-run.ts` with `claimCronRun` (`createMany` with `skipDuplicates`, true only when `count === 1`) and `pruneCronRuns`; add `CRON_RUN_RETENTION_MS` as a named constant; verify unit tests: first claim wins, same slot refused, other job or other slot claims, 50 concurrent claims on a fake store with real unique-key semantics produce exactly one winner
- [ ] 1.3 Add a real-database test under `e2e/` that runs 20 concurrent claims for one slot from independent Prisma clients and asserts exactly one returns true and one row exists; verify it passes against the `e2e` database

## 2. Scheduler integration

- [ ] 2.1 Add `get-slot.ts` (nearest-minute rounding of `TaskContext.date`) and confirm in a test against node-cron 4.6.0 what `date` holds when a task fires; verify tests for rounding up, rounding down, an early timer and whole-minute output
- [ ] 2.2 Update `CronScheduler.scheduleTask` to claim before running, skip and log when not claimed, skip and log when the claim throws, run and log duration as before when claimed, and reject six-field expressions; verify scheduler tests for each branch
- [ ] 2.3 Prune old records after a win, logging (not throwing) on a prune failure; verify tests that only winners prune and a prune error does not fail the job
- [ ] 2.4 Add multi-replica scheduler tests: several `CronScheduler` instances sharing one fake store, each tick triggered on every instance at once, a late replica after the job finished, two jobs in the same slot, consecutive slots, and a job that throws is not retried; verify the job body ran exactly once per slot in each case
- [ ] 2.5 Verify existing `scheduler`, `init`, `instrumentation` and cleanup job tests still pass with `pnpm test`

## 3. Specs and wrap-up

- [ ] 3.1 Run `openspec validate cron-job-claiming`; fix any findings
- [ ] 3.2 Add the `cron-jobs` line to the specs index in `openspec/config.yaml`; verify the index matches `openspec/specs/`
- [ ] 3.3 Run `pnpm lint`, `pnpm exec prettier --check .`, `pnpm test` and the cron E2E; verify all pass
- [ ] 3.4 Commit as `feat(cron): claim scheduled runs so each executes once across replicas`

## Workflow follow-up

- Archive this change with `openspec-archive-change` after review so `openspec/specs/cron-jobs/spec.md` is created.
