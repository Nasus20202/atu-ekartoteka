## ADDED Requirements

### Requirement: Streamed Page Checks

A page request SHALL pass only when the response is the page, not a redirect that
was sent after the shell. A page check SHALL verify the status and that the body
carries no redirect marker.

#### Scenario: Expired session

- **GIVEN** a virtual user whose session no longer works
- **WHEN** it requests a streamed page and the server redirects after sending the shell
- **THEN** the check fails although the status is 200

## MODIFIED Requirements

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
- **THEN** it visits the dashboard, charges, the tenant's apartment charges, payments, the tenant's payment details for a random seeded year and profile pages with think time between them, reading each streamed response to its end

#### Scenario: Admin journey

- **GIVEN** a signed-in admin
- **WHEN** the `admin_journey` scenario runs
- **THEN** it visits the admin pages, whose HTML already contains their initial data, and calls the admin JSON routes that still exist, for a random HOA and apartment each iteration

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

- **GIVEN** a tracked endpoint (the dashboard pages, the admin pages and lists, and login)
- **WHEN** its p95 duration exceeds its limit
- **THEN** the run fails, even if the scenario as a whole stays within its limit

#### Scenario: Limits follow measurements

- **GIVEN** the limits in `perf/lib/thresholds.ts`
- **WHEN** they are set or changed
- **THEN** each sits at roughly 1.5 times the slowest p95 measured in CI at peak load, so a real regression fails while a slower runner does not

#### Scenario: Removed route

- **GIVEN** an API route that was deleted
- **WHEN** the run starts
- **THEN** no scenario requests it and no threshold refers to it
