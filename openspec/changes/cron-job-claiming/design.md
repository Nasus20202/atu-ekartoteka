# Design

## Context

`CronScheduler.scheduleTask(name, schedule, task)` in `src/lib/cron/scheduler.ts` wraps `node-cron` 4.6.0 and is called from `initializeCronJobs`, which `src/instrumentation.ts` runs in every Node.js process. Each replica therefore fires every job. node-cron passes the callback a `TaskContext` with the scheduled `date` and `triggeredAt`. `AGENTS.md` rules: Prisma query API only, no raw SQL outside migrations, files under 200 lines, mutations under `src/lib/mutations/`, tests in `__tests__`. See proposal.md for motivation.

## Goals / Non-Goals

**Goals:**

- A scheduled run executes at most once across all replicas, with no raw SQL and no timing assumptions.
- Job code is unchanged; claiming lives in the scheduler.

**Non-Goals:**

- Retries, catch-up after downtime, leases, or a general job queue.

## Decisions

**Claim by inserting a unique row, not by locking.** `model CronRun { id String @id @default(cuid()), jobName String, slot DateTime, claimedAt DateTime @default(now()), @@unique([jobName, slot]), @@index([slot]) }`. A replica runs `prisma.cronRun.createMany({ data: [{ jobName, slot }], skipDuplicates: true })`; Prisma emits `INSERT ... ON CONFLICT DO NOTHING`, and `count === 1` means this replica won. Postgres resolves concurrent inserts of the same key atomically, so exactly one insert creates the row. Because the record is permanent (until pruning), a slot can never be claimed again, which is what makes "never run twice" hold regardless of how long the job takes, if a replica crashes, or how clocks drift. Alternatives: a lease row with `lockedUntil` and an `updateMany` compare-and-set (rejected: a job longer than the lease, or a slow replica waking after expiry, can run twice); `pg_advisory_lock` (rejected: raw SQL, and a lock is released when the job ends so a late replica runs it again).

**Slot is the scheduled time.** The slot comes from `TaskContext.date` rounded to the nearest minute, so replicas that fire a few hundred milliseconds apart compute the same slot. Rounding (not flooring) covers a timer that fires slightly early. The scheduler accepts five-field cron expressions only (minute granularity), so every slot is a whole minute; a six-field (seconds) expression is rejected at registration. Task 2.1 verifies what `date` holds; if it is the wall-clock fire time rather than the scheduled time, rounding still gives one slot while replica clocks agree within 30 seconds.

**Fail closed.** If `createMany` throws, the run is skipped and logged. Running unclaimed would reintroduce duplicates. A claimed job that throws is logged and not retried; the next slot is independent.

**Pruning by the winner.** After winning a claim the replica runs `deleteMany({ where: { slot: { lt: slot - CRON_RUN_RETENTION_MS } } })`, with retention a named constant of 7 days. Only winners prune, so the cost is one extra delete per run, and a pruning failure is logged without affecting the job. Retention far exceeds any realistic clock skew, so no claimable slot is deleted.

**Where it lives.** `src/lib/mutations/cron/claim-cron-run.ts` (`claimCronRun(jobName, slot): Promise<boolean>` and `pruneCronRuns(before)`), and a small `src/lib/cron/get-slot.ts`. The scheduler's tick becomes: compute the slot, claim, log and return if not claimed, otherwise run the task as before. `initializeCronJobs` and the job modules do not change.

**Email.** `email-notifications` already exists as its own capability; the two cleanup jobs are specified in the new `cron-jobs` capability.

## Risks / Trade-offs

- [Replica clocks differ by more than 30 s, putting the same tick in different slots] → NTP-synced hosts are assumed; documented in the spec's scenarios; a test covers sub-second differences and early timers.
- [A claimed job whose replica crashes is not retried] → accepted, jobs are idempotent hourly cleanups and the next slot repeats the work; documented as a non-goal.
- [Extra write per tick per replica] → one `INSERT ... ON CONFLICT DO NOTHING` per job per hour per replica.
- [`createMany` with `skipDuplicates` swallows other conflicts] → the only unique constraints are the primary key (`cuid`) and `(jobName, slot)`.

## Migration Plan

One migration creating `CronRun` (new table, no data to move). Deploying a mix of old and new replicas is safe: old replicas still run unclaimed, so duplicates continue only until the rollout finishes. Rollback: drop the table with the previous image.
