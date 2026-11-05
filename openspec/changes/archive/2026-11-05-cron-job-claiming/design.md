# Design

## Context

`CronScheduler.scheduleTask(name, schedule, task)` in `src/lib/cron/scheduler.ts` wraps `node-cron` 4.6.0 and is called from `initializeCronJobs`, which `src/instrumentation.ts` runs in every Node.js process. Each replica therefore fires every job. node-cron 4.6 has a distributed mode: a task scheduled with `distributed: true` asks a `RunCoordinator.shouldRun(key, ttl)` before each run, where `key` is `<task name>:<scheduled time ISO>`. The time is the schedule's own slot, the same on every replica, not the wall clock at fire time. A coordinator that throws makes node-cron skip the run (fail closed) and emit `execution:skipped` with reason `coordinator-error`; a coordinator that returns `false` skips it with reason `not-elected`. `AGENTS.md` rules: Prisma query API only, no raw SQL outside migrations, files under 200 lines, mutations under `src/lib/mutations/`, tests in `__tests__`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- A scheduled run executes at most once across all replicas, with no raw SQL and no timing assumptions.
- Job code is unchanged; claiming lives in the scheduler.

**Non-Goals:**

- Retries, catch-up after downtime, leases, or a general job queue.

## Decisions

**Use node-cron's distributed mode with a database coordinator.** The library already computes the scheduled slot, builds the key, fails closed and reports skips, so the only missing piece is a shared store. Alternative: derive the slot from `TaskContext.date` ourselves; rejected because that is the wall-clock fire time, so a stalled replica could compute a different slot and run twice.

**Claim by inserting a unique row, not by locking.** `model CronRun { key String @id, claimedAt DateTime @default(now()), @@index([claimedAt]) }`. The coordinator runs `prisma.cronRun.createMany({ data: [{ key }], skipDuplicates: true })`; Prisma emits `INSERT ... ON CONFLICT DO NOTHING`, and `count === 1` means this replica won. Postgres resolves concurrent inserts of the same key atomically, so exactly one insert creates the row. The record outlives the run (until pruning), so a key can never be claimed again, which is what makes "never run twice" hold regardless of how long the job takes, if a replica crashes, or how clocks drift. node-cron's `ttl` argument is ignored for that reason. Alternatives: a lease row with `lockedUntil` and an `updateMany` compare-and-set (rejected: a job longer than the lease, or a slow replica waking after expiry, can run twice); `pg_advisory_lock` (rejected: raw SQL, and the lock is released when the job ends so a late replica runs it again).

**Fail closed.** If `createMany` throws, the coordinator logs and rethrows, and node-cron does not run the job. Running unclaimed would reintroduce duplicates. A claimed job that throws is logged by the scheduler and not retried; the next slot is independent.

**Pruning by the winner.** After winning a claim the coordinator runs `deleteMany({ where: { claimedAt: { lt: now - CRON_RUN_RETENTION_MS } } })`, with retention a named constant of 7 days. Only winners prune, so the cost is one extra delete per run, and a pruning failure is logged without affecting the job. Retention far exceeds any realistic clock skew, so no claimable key is deleted.

**Where it lives.** `src/lib/mutations/cron/claim-cron-run.ts` (`claimCronRun(key, store)` and `pruneCronRuns(now, store)`, taking the store as a parameter so tests and E2E can use independent clients), `src/lib/cron/run-coordinator.ts` (`createRunCoordinator(store)`), and `src/lib/cron/constants.ts`. `CronScheduler` takes the coordinator in its constructor (defaulting to the Prisma-backed one), passes `{ name, distributed: true, runCoordinator }` to `cron.schedule`, and logs `execution:skipped` events (`not-elected` at info, `coordinator-error` at error). `initializeCronJobs` and the job modules do not change.

**Email.** `email-notifications` already exists as its own capability; the two cleanup jobs are specified in the new `cron-jobs` capability.

## Risks / Trade-offs

- [A claimed job whose replica crashes is not retried] → accepted, jobs are idempotent hourly cleanups and the next slot repeats the work; documented as a non-goal.
- [Extra write per tick per replica] → one `INSERT ... ON CONFLICT DO NOTHING` per job per hour per replica.
- [`createMany` with `skipDuplicates` swallows other conflicts] → the only unique constraint is the primary key.
- [node-cron's distributed mode changes in a later release] → the version is pinned (`4.6.0`) and tests run real node-cron across several replicas, so an upgrade that breaks claiming fails the suite.

## Migration Plan

One migration creating `CronRun` (new table, no data to move). Deploying a mix of old and new replicas is safe: old replicas still run unclaimed, so duplicates continue only until the rollout finishes. Rollback: drop the table with the previous image.
