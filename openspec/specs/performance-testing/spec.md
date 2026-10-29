# Capability: Performance Testing

## Purpose

Guards response times and error rates under concurrent load. k6 scenarios run in CI against the production Docker image, so a change that slows the app or makes it fail under load is caught before the image is published.

## Stack

- **Load tool**: k6 (`perf/load-test.js`), version pinned in `.github/workflows/test-and-build.yaml`
- **Target**: the Docker image started with `docker-compose.e2e.yaml` and seeded with `e2e/utils/seed-test-data.ts` (admin account) and `perf/seed/seed-perf-data.ts` (production-sized dataset)
- **Configuration**: peak load and timing in `perf/lib/config.js`, latency limits in `perf/lib/thresholds.js`

---

## Requirements

### Requirement: Scenarios

The load test SHALL exercise the main traffic types at the same time.

#### Scenario: Public pages

- **GIVEN** an anonymous visitor
- **WHEN** the `public` scenario runs
- **THEN** it requests `/api/health`, `/api/config/turnstile`, `/login`, `/register` and `/forgot-password` at a fixed arrival rate

#### Scenario: Credential logins

- **GIVEN** the seeded tenant accounts
- **WHEN** the `login` scenario runs
- **THEN** each iteration clears its cookies and signs in as a random tenant through the credentials provider, so every iteration pays for a full bcrypt comparison

#### Scenario: Tenant journey

- **GIVEN** a signed-in tenant (each virtual user signs in once, as its own tenant)
- **WHEN** the `user_journey` scenario runs
- **THEN** it visits the dashboard, charges, the tenant's apartment charges, payments, the tenant's payment details for a random seeded year and profile pages with think time between them

#### Scenario: Admin journey

- **GIVEN** a signed-in admin
- **WHEN** the `admin_journey` scenario runs
- **THEN** it visits the admin apartments, users and import pages and calls the admin JSON APIs they use, requesting a random apartments page, a random apartment, a random page of unassigned apartments, an apartment search, and the pages and JSON APIs of a random HOA (its apartments and financial summary) and a random apartment each iteration

---

### Requirement: Production-Sized Dataset

The load test SHALL run against a dataset of production scale, so query cost reflects table size and virtual users do not all read the same cached rows.

#### Scenario: Seeded volume

- **GIVEN** the default seed
- **WHEN** `perf/seed/seed-perf-data.ts` runs
- **THEN** it creates 100 HOAs with 100 apartments each, 1000 tenants owning evenly spaced apartments, and 200 charges, 3 notifications and 6 payment years per apartment

#### Scenario: Fast loading

- **GIVEN** the default seed
- **WHEN** it loads the charges
- **THEN** it inserts them over parallel connections, so the 2 million rows take well under a minute

#### Scenario: Overridable volume

- **GIVEN** a developer who needs a smaller or larger dataset
- **WHEN** they set `PERF_SEED_*` variables for the seed and `PERF_TENANTS` / `PERF_APARTMENTS` for k6
- **THEN** both use the same sizes

---

### Requirement: Increasing Load Profile

Every scenario SHALL reach its peak load gradually, so the results show how latency grows with load rather than only at a single level.

#### Scenario: Stepped ramp

- **GIVEN** a scenario with a peak load (virtual users or iterations per second)
- **WHEN** the test runs
- **THEN** the load rises to 25%, 50%, 75% and 100% of the peak, holding each step, then holds the peak and drains to zero

#### Scenario: Overridable load

- **GIVEN** a developer or CI job that needs a different load
- **WHEN** it sets `PERF_USER_VUS`, `PERF_ADMIN_VUS`, `PERF_PUBLIC_RATE`, `PERF_LOGIN_RATE` or the `PERF_*` step durations
- **THEN** the test uses those values instead of the defaults

---

### Requirement: Thresholds

The run SHALL fail when the app returns errors or responds slower than the agreed limits.

#### Scenario: Errors

- **GIVEN** a completed run
- **WHEN** more than 0.1% of requests fail or of checks fail
- **THEN** the run fails

#### Scenario: Schedule kept

- **GIVEN** the arrival-rate scenarios (`public`, `login`)
- **WHEN** k6 cannot start an iteration on time because all virtual users are busy
- **THEN** the dropped iteration is counted and any dropped iteration fails the run

#### Scenario: Latency per scenario

- **GIVEN** the requests of one scenario
- **WHEN** their average or p95 duration exceeds that scenario's limit
- **THEN** the run fails

#### Scenario: Latency per endpoint

- **GIVEN** a tracked endpoint (the dashboard pages, the admin apartment and user lists, and login)
- **WHEN** its p95 duration exceeds its limit
- **THEN** the run fails, even if the scenario as a whole stays within its limit

#### Scenario: Limits follow measurements

- **GIVEN** the limits in `perf/lib/thresholds.js`
- **WHEN** they are set or changed
- **THEN** each sits at roughly three times the value measured in CI at peak load, so a real regression fails while a slower runner does not

---

### Requirement: Reporting

Each run SHALL publish a readable summary.

#### Scenario: Job summary

- **GIVEN** a completed run, passing or failing
- **WHEN** CI finishes the performance job
- **THEN** `perf-results/summary.md` (peak load, request and iteration counts, dropped iterations, time to first byte, data received and every threshold with its observed values) is added to the job summary, and `perf-results/` is uploaded as an artifact

#### Scenario: Failure logs

- **GIVEN** a failed performance job
- **WHEN** application logs are printed
- **THEN** only the last lines are shown, so the k6 summary stays readable
