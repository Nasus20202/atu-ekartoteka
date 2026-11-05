# Proposal

## Why

`initializeCronJobs` runs in every server process, so with N replicas each hourly job runs N times. Today's two jobs are idempotent deletes, so the cost is only wasted queries, but any job that sends email or otherwise has side effects would run once per replica. Scheduled behaviour is also not specified anywhere in `openspec/`.

## What Changes

- Add a `CronRun` table with a unique `(jobName, slot)` pair, where `slot` is the scheduled fire time.
- Before running, each replica tries to insert the row for the current slot through the Prisma query API (`createMany` with `skipDuplicates`); only the replica whose insert creates the row runs the job. The unique constraint makes the claim atomic, so a slot can never be run twice, whatever the replica count, run duration or timing.
- If the claim query fails the run is skipped and logged (fail closed); a claimed job that throws is logged and not retried in that slot.
- Old claims are pruned by the replica that wins a claim, so the table stays small.
- Add the `cron-jobs` capability spec covering the existing jobs (expired verification codes, expired or used password reset tokens) and the claiming rules.
- No change to job schedules or to job code.

## Capabilities

### New Capabilities

- `cron-jobs`: scheduled background jobs, their schedules, and the guarantee that each scheduled run executes at most once across all replicas.

### Modified Capabilities

None. `email-notifications` is already its own capability and is not changed; the verification-code and password-reset cleanup jobs are specified in `cron-jobs`.

## Impact

- `prisma/schema.prisma` and a new migration (create `CronRun`).
- `src/lib/cron/scheduler.ts`, a new claim module and mutation under `src/lib/cron/` and `src/lib/mutations/cron/`, with tests.
- An E2E test against the real database proving concurrent claims create one run.
- `openspec/specs/cron-jobs/spec.md` (new) and the specs index in `openspec/config.yaml`.

## Non-goals

- Retrying a missed or failed slot, a job queue, or catch-up runs after downtime.
- Leader election, advisory locks or any raw SQL.
- Changing schedules, adding jobs, or moving to an external scheduler.
