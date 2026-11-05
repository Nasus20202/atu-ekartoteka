# Tasks

## 1. Schema and claim mutation

- [x] 1.1 Add `CronRun` (`key` primary key, `claimedAt`, index on `claimedAt`) to `prisma/schema.prisma` and a migration creating it; verify `prisma migrate deploy` and `prisma generate` succeed and `prisma migrate diff` reports no drift
- [x] 1.2 Add `src/lib/mutations/cron/claim-cron-run.ts` with `claimCronRun` (`createMany` with `skipDuplicates`, true only when `count === 1`) and `pruneCronRuns`, plus `CRON_RUN_RETENTION_MS` in `src/lib/cron/constants.ts`; verify unit tests: first claim wins, same key refused, other job or other time claims, 50 concurrent claims on a fake store with primary-key semantics produce exactly one winner, a store failure propagates, only runs past retention are pruned
- [x] 1.3 Add a real-database test under `e2e/cron/` with 20 independent Prisma clients claiming one key concurrently, a late replica, and 3 schedulers running every second against the database; verify it passes against the E2E database and fails when the claim always reports success

## 2. Scheduler integration

- [x] 2.1 Add `src/lib/cron/run-coordinator.ts` (`createRunCoordinator`: claim, prune the winner's old records without failing the run, log and rethrow a failed claim); verify tests for win, denied replicas, pruning only on a win, a prune failure still running the job, and a claim failure rethrown and logged
- [x] 2.2 Update `CronScheduler` to take the coordinator, schedule with `distributed: true`, and log `execution:skipped` (not-elected at info, coordinator-error at error); verify scheduler tests for the options passed and both log branches
- [x] 2.3 Add multi-replica scheduler tests with the real node-cron library and a seconds-granularity schedule: several replicas, two jobs in the same slot, a job that outlasts the next slot, a job that throws, and a claim outage with recovery; verify the job body ran exactly once per claimed run in each case and that the tests fail when claims always succeed
- [x] 2.4 Verify existing `scheduler`, `init`, `instrumentation` and cleanup job tests still pass with the full `vitest run`

## 3. Specs and wrap-up

- [x] 3.1 Run `openspec validate cron-job-claiming --strict`; fix any findings
- [x] 3.2 Add the `cron-jobs` line to the specs index in `openspec/config.yaml`; verify the index matches `openspec/specs/`
- [x] 3.3 Run lint, type-check and the full unit suite plus the cron E2E; verify all pass
- [x] 3.4 Commit as `feat(cron): claim scheduled runs so each executes once across replicas`

## Workflow follow-up

- Archive this change with `openspec-archive-change` after review so `openspec/specs/cron-jobs/spec.md` is created.
