# Capability: Observability

## Purpose

Provides structured logging, distributed tracing, and metrics collection so that the application's behaviour can be understood, debugged, and monitored in production. All three signals are emitted via OpenTelemetry and exported to a configurable OTLP collector. The system degrades gracefully: if no collector endpoint is configured, telemetry is disabled and no errors are raised.

---

## Requirements

### Requirement: Structured Logging

The application SHALL emit structured JSON logs via `pino`.

#### Scenario: Log output format

- **GIVEN** any server-side code that calls `createLogger`
- **WHEN** a log statement is emitted
- **THEN** it is written as a single JSON object including at minimum `level`, `time`, `name` (the logger name), `msg`, and any extra fields passed as the first argument

#### Scenario: Log levels

- **GIVEN** the `LOG_LEVEL` environment variable
- **WHEN** the application starts
- **THEN** only log entries at or above the configured level are emitted; when `LOG_LEVEL` is unset the default level applies

#### Scenario: Logger naming

- **GIVEN** a module that needs logging
- **WHEN** it calls `createLogger('auth:providers')`
- **THEN** every log line from that module includes `"name": "auth:providers"` so log aggregation tools can filter by subsystem

#### Scenario: Console output

- **GIVEN** the server runs in production
- **WHEN** application code or Next.js writes with `console.debug`, `console.log`, `console.info`, `console.warn` or `console.error`
- **THEN** the line is emitted as a pino record at the matching level (`log` maps to `info`), with terminal colour codes and e-mail addresses removed and an `Error` argument logged as `error`

#### Scenario: Expected framework errors

- **GIVEN** Next.js rejects a request because of the caller, such as an unknown Server Action ID ("The Server Reference ID did not match the expected format") or a failed Server Action origin check ("Invalid Server Actions request")
- **WHEN** the message reaches `console.error`
- **THEN** the unknown Server Action ID is logged at `info` and the failed origin check at `warn`, instead of `error`

#### Scenario: Pino instrumentation

- **GIVEN** OpenTelemetry is initialised (OTLP endpoint set)
- **WHEN** a Pino log entry is emitted
- **THEN** `PinoInstrumentation` injects the active trace context (`traceId`, `spanId`) into the log record so logs and traces can be correlated

---

### Requirement: Distributed Tracing

The application SHALL produce OTLP traces when `OTEL_EXPORTER_ENDPOINT` is set.

#### Scenario: SDK initialisation

- **GIVEN** `OTEL_EXPORTER_ENDPOINT` is set at application start
- **WHEN** `initTracing()` is called
- **THEN** the OpenTelemetry `NodeSDK` starts with OTLP trace, metric, and log exporters all pointing to `{OTEL_EXPORTER_ENDPOINT}/v1/{traces|metrics|logs}`

#### Scenario: No endpoint configured

- **GIVEN** `OTEL_EXPORTER_ENDPOINT` is absent or empty
- **WHEN** `initTracing()` is called
- **THEN** the SDK is not started; a single info log "OTEL_EXPORTER_ENDPOINT not set, skipping OpenTelemetry" is emitted; the application continues normally

#### Scenario: HTTP instrumentation

- **GIVEN** an incoming HTTP request to any route except `/api/health` and `/_next`
- **WHEN** the request is processed
- **THEN** `HttpInstrumentation` creates a span with a normalised name of the form `{METHOD} {path}` where dynamic segments (UUIDs, CUIDs, numeric IDs) are replaced with `/*`

#### Scenario: Health check exclusion

- **GIVEN** an incoming request to `/api/health` or any `/_next` path
- **WHEN** `HttpInstrumentation` evaluates `ignoreIncomingRequestHook`
- **THEN** no span is created for that request

#### Scenario: Database query tracing

- **GIVEN** Prisma executing a SQL query via the `pg` driver
- **WHEN** `PgInstrumentation` is active
- **THEN** a child span is created for the query under the current request span, recording the operation and database name

#### Scenario: Runtime metrics

- **GIVEN** the SDK is started
- **WHEN** the Node.js runtime executes
- **THEN** `RuntimeNodeInstrumentation` emits event-loop lag, heap usage, and GC metrics automatically

#### Scenario: Graceful shutdown

- **GIVEN** the process receives `SIGTERM`
- **WHEN** the shutdown handler fires
- **THEN** `sdk.shutdown()` is awaited; on success an info log is emitted; on error it is logged at `error` level; `process.exit(0)` is called in both cases

---

### Requirement: Resource Attribution

Telemetry signals SHALL be tagged with resource attributes that identify the service and, optionally, its Kubernetes context.

#### Scenario: Required attributes

- **GIVEN** any exported span, metric, or log record
- **WHEN** it arrives at the collector
- **THEN** it carries `service.name` (defaulting to `atu-ekartoteka`, overridable via `OTEL_SERVICE_NAME`) and `service.version` (read from `package.json`)

#### Scenario: Kubernetes attributes

- **GIVEN** `K8S_NAMESPACE` and `K8S_POD_NAME` environment variables are set
- **WHEN** the SDK initialises
- **THEN** the resource also includes `k8s.namespace.name` and `k8s.pod.name`

---

### Requirement: Authentication Metrics

Authentication events SHALL be counted and exposed as OTLP metrics under the `ekartoteka.auth` meter.

#### Scenario: Login counter

- **GIVEN** a login attempt completes (success or failure)
- **WHEN** `authMetrics.recordLogin(provider, result, reason?)` is called
- **THEN** the `ekartoteka.auth.login` counter is incremented with attributes:
  - `provider`: `credentials` | `google`
  - `result`: `success` | `failure`
  - `reason` (only on failure): one of `invalid_credentials`, `user_not_found`, `no_password`, `invalid_turnstile`, `missing_turnstile`, `google_email_unverified`, `google_error`

#### Scenario: Registration counter

- **GIVEN** a new user account is created
- **WHEN** `authMetrics.recordRegistration(provider, result)` is called
- **THEN** the `ekartoteka.auth.registration` counter is incremented with `provider` and `result`

#### Scenario: Password reset counter

- **GIVEN** a password reset is requested or completed
- **WHEN** `authMetrics.recordPasswordReset(result)` is called
- **THEN** the `ekartoteka.auth.password_reset` counter is incremented with `result`

#### Scenario: Email verification counter

- **GIVEN** an email verification attempt is processed
- **WHEN** `authMetrics.recordEmailVerification(result)` is called
- **THEN** the `ekartoteka.auth.email_verification` counter is incremented with `result`

#### Scenario: Invite counter

- **GIVEN** an administrator invites the owners of unassigned apartments and the accounts are created
- **WHEN** `authMetrics.recordInvites(counts)` is called once for the batch
- **THEN** the `ekartoteka.auth.invite` counter is incremented by the number of accounts for each `result` above zero:
  - `success`: the account was created and its activation email delivered
  - `email_failed`: the account was created but the activation email was not delivered
  - `skipped`: an account for the e-mail address already existed
  - `failure`: the account could not be created
- **AND** the activation emails themselves are counted by `ekartoteka.email.sent` with type `account_activation`, and no attribute carries an e-mail address or an identifier

#### Scenario: Account status counter

- **GIVEN** an administrator changes the status of an account and the update is saved
- **WHEN** `authMetrics.recordAccountStatusChange(status)` is called
- **THEN** the `ekartoteka.auth.account_status` counter is incremented with `status`: `pending`, `approved` or `rejected`
- **AND** a refused or failed update is not counted

#### Scenario: Assignment counter

- **GIVEN** an administrator assigns unassigned apartments to existing accounts
- **WHEN** `authMetrics.recordAssignments(counts)` is called once for the batch
- **THEN** the `ekartoteka.auth.assignment` counter is incremented by the number of apartments for each `result` above zero: `success`, `skipped` (no account for the e-mail, or already assigned) or `failure`

#### Scenario: Invites on the dashboard

- **GIVEN** the Grafana dashboard in `grafana/dashboards/ekartoteka.json`
- **WHEN** its Authentication row is shown
- **THEN** it has panels with the invites by `result`, account status changes by `status` and apartment assignments by `result` over time

---

### Requirement: Email Metrics

Every email send attempt SHALL be counted (see also: `email-notifications/spec.md`).

#### Scenario: Email sent counter

- **GIVEN** `emailMetrics.recordEmailSent(type, result)` is called after any send attempt
- **WHEN** the metric is exported
- **THEN** the `ekartoteka.email.sent` counter is incremented with:
  - `type`: one of `verification`, `password_reset`, `account_approved`, `account_activation`, `admin_notification`, `vote_confirmation`, `voting_notification`, `other`
  - `result`: `success` | `failure` | `skipped`

---

### Requirement: Import Metrics

Import runs SHALL be counted, timed and summarised as OTLP metrics under the `ekartoteka.import` meter. The runs are `data` (text file import), `database_validation`, `settlement_preview` and `settlement` (settlement PDF import).

#### Scenario: Run counter and duration

- **GIVEN** an import run finishes
- **WHEN** the run is measured
- **THEN** the `ekartoteka.import.run` counter is incremented with:
  - `type`: `data` | `database_validation` | `settlement_preview` | `settlement`
  - `result`: `success` when the run is complete, `partial` when it stopped short but some of it succeeded, `failure` otherwise
- **AND** the `ekartoteka.import.duration` histogram records the run's duration in seconds with the same attributes, using explicit bucket boundaries from 0.1 s to 300 s

#### Scenario: Failed run

- **GIVEN** an import run throws
- **WHEN** the run is measured
- **THEN** it is counted with `result` `failure` and the error is rethrown unchanged

#### Scenario: Records written

- **GIVEN** an import run writes records
- **WHEN** the run is measured
- **THEN** the `ekartoteka.import.records` counter is incremented by the number of records for each `entity` (`apartment`, `charge`, `notification`, `payment`, `utility_settlement`, `annual_settlement`) and `action` (`created`, `updated`, `skipped`, `deleted`, `unchanged`), and zero counts are not added
- **AND** an HOA whose transaction was rolled back, or that was stopped before any write, counts no records
- **AND** previews and database validation count no records

#### Scenario: Findings

- **GIVEN** an import run reports errors or warnings
- **WHEN** the run is measured
- **THEN** the `ekartoteka.import.findings` counter is incremented once per finding with `type`, `severity` (`error` | `warning`) and `kind` (the import error, import warning or settlement issue kind)
- **AND** an association error copied into the batch error list is counted only once

#### Scenario: Recording never changes the import

- **GIVEN** a metric cannot be recorded
- **WHEN** the run finishes
- **THEN** the failure is logged and the run returns its result as usual

#### Scenario: Imports on the dashboard

- **GIVEN** the Grafana dashboard in `grafana/dashboards`
- **WHEN** its Imports row is shown
- **THEN** it has panels for runs by type and result, duration p50 and p95 by type, records by entity and action, and findings by severity and kind, counted over the selected time range

---

### Requirement: Database Size Metrics

Row counts for core database tables SHALL be exposed as an observable gauge.

#### Scenario: Table row counts exported

- **GIVEN** OpenTelemetry is initialised
- **WHEN** the metric reader collects from the `ekartoteka.db.size` gauge
- **THEN** it returns the cached row count for each of the following tables, each as a separate data point with a `table` attribute:
  `homeownersAssociation`, `apartment`, `charge`, `chargeNotification`, `payment`, `user`, `utilitySettlement`, `meterReading`, `annualCostSettlement`, `voting`, `votingBallot`, `votingConfirmation`

#### Scenario: Count refresh interval

- **GIVEN** the database metrics are registered
- **WHEN** 30 seconds elapse
- **THEN** fresh `COUNT(*)` queries are issued to the database for all tracked tables and the cache is updated

#### Scenario: Metric export interval

- **GIVEN** the `PeriodicExportingMetricReader` configuration
- **WHEN** the SDK is running
- **THEN** metrics are pushed to the OTLP endpoint every 60 seconds

#### Scenario: Counts on the dashboard

- **GIVEN** the Grafana dashboard in `grafana/dashboards`
- **WHEN** its overview is shown
- **THEN** it has a count panel for utility settlements, meter readings and annual cost settlements

---

### Requirement: Voting Metrics

Voting lifecycle events SHALL be counted and exposed as OTLP metrics under the `ekartoteka.voting` meter. Voting emails are counted by the email metrics (`ekartoteka.email.sent` with type `vote_confirmation` or `voting_notification`), not by a voting counter. Recording a metric SHALL NOT change the outcome of a voting action, and no attribute SHALL carry a voting, owner or apartment identifier.

#### Scenario: Status change counter

- **GIVEN** a voting is created as a draft or a status transition succeeds
- **WHEN** the use case records it
- **THEN** the `ekartoteka.voting.status_change` counter is incremented with `status`: `draft`, `active`, `closed` or `archived`
- **AND** a refused transition or a creation that failed is not counted
- **AND** deleting a draft is counted with `status` `deleted`

#### Scenario: Meeting ballot counter

- **GIVEN** an administrator enters or removes a ballot cast at a meeting
- **WHEN** the change is stored
- **THEN** the `ekartoteka.voting.meeting_ballot` counter is incremented with `action`: `added` or `removed`
- **AND** a refused or not found ballot is not counted

#### Scenario: Confirmation counter

- **GIVEN** an owner requests the emailed link of a vote or opens it
- **WHEN** the step ends with one of the outcomes below
- **THEN** the `ekartoteka.voting.confirmation` counter is incremented with `result`:
  - `requested` when the email was sent, `email_failed` when it was not, `rate_limited` when a link was requested within the rate limit window
  - `confirmed` when the ballots were stored
  - `rejected` with a `reason`: `invalid_link` (malformed, unknown or already used link, or stored answers that no longer fit), `foreign_link`, `expired`, `closed` (voting closed or no longer visible to the owner), or `already_voted`
- **AND** invalid input such as incomplete answers, and accounts without access to votings, are not counted

#### Scenario: Ballot counter

- **GIVEN** a confirmation stores ballots
- **WHEN** the ballots are stored
- **THEN** the `ekartoteka.voting.ballot` counter is incremented by the number of ballots, without attributes

#### Scenario: Votings per status gauge

- **GIVEN** the voting metrics are registered
- **WHEN** the metric reader collects `ekartoteka.voting.count`
- **THEN** it returns the number of votings for each `status` (`draft`, `active`, `closed`, `archived`), with 0 for a status without votings
- **AND** the counts are read with one grouped query every 30 seconds and the callback reports the cached values
- **AND** every replica reports the same counts, so the dashboard reads them with `max by (status)`, never `sum`

#### Scenario: Voting dashboard

- **GIVEN** the Grafana dashboard in `grafana/dashboards/ekartoteka.json`
- **WHEN** it is opened for a namespace
- **THEN** its Voting row shows the votings, ballots and pending confirmations counts, votings by status, status changes, ballots cast in the selected range, meeting ballots by action, confirmation outcomes by result and rejections by reason
- **AND** every panel filters on `k8s_namespace_name` and the event counts use `increase` over the selected range

---

### Requirement: Logs Carry No Direct Identifiers

The application SHALL NOT write e-mail addresses, names, passwords, tokens, IP addresses or free-text user input to its logs. It SHALL identify people only by the account ID.

#### Scenario: Successful login

- **GIVEN** a user who logs in with valid credentials
- **WHEN** the login is logged
- **THEN** the entry holds the account ID, role and status, and no e-mail address

#### Scenario: Login for an account that does not exist

- **GIVEN** a login attempt with an e-mail address that has no account
- **WHEN** the failure is logged
- **THEN** the entry says the account was not found and holds no part of what was typed

#### Scenario: Wrong password

- **GIVEN** a login attempt with a wrong password for an existing account
- **WHEN** the failure is logged
- **THEN** the entry holds the account ID and no e-mail address

#### Scenario: Sending an e-mail

- **GIVEN** any e-mail the application sends
- **WHEN** the send is logged
- **THEN** the entry holds the e-mail type and the result, and no recipient address

#### Scenario: Administrator actions

- **GIVEN** an admin approving a user, changing an apartment or importing data
- **WHEN** the action is logged
- **THEN** the entry holds the admin's account ID and the affected entity's ID, and no e-mail address

#### Scenario: Bulk account creation

- **GIVEN** an admin creating accounts for owners who have not registered
- **WHEN** the run and its failures are logged
- **THEN** the entries hold counts and internal apartment IDs, and no owner e-mail address or owner ID

#### Scenario: Bot check failures

- **GIVEN** a failed Turnstile verification or a missing Turnstile token
- **WHEN** it is logged
- **THEN** the entry holds the provider's error codes and never the token

#### Scenario: Authentication library debug output

- **GIVEN** the authentication library emits a debug message with metadata
- **WHEN** it is logged
- **THEN** only the message is written and the metadata is dropped

### Requirement: Errors Are Logged Safely

The application SHALL log errors through one serializer that keeps the error name, its code and a message with e-mail addresses replaced and the text truncated, and SHALL NOT log raw error objects or the arguments of a failed query.

#### Scenario: Database error

- **GIVEN** a database error whose message echoes the values of the failed call
- **WHEN** it is logged as `{ error }`
- **THEN** the entry holds the error name and code and no argument value

#### Scenario: Mail transport error

- **GIVEN** an SMTP error whose message contains a recipient address
- **WHEN** it is logged
- **THEN** the address is replaced by `[redacted-email]`

#### Scenario: Request error path

- **GIVEN** a failed request whose URL has a query string
- **WHEN** the request error is logged
- **THEN** the path is logged without the query string

### Requirement: Known Personal Fields Are Censored

The logger SHALL censor the fields `email`, `to`, `name`, `password` and `token` at the top level of a log object and one level below it, so a mistake cannot leak them, and the OTLP log export SHALL carry the censored value.

#### Scenario: Backstop

- **GIVEN** a log call that passes an `email` field
- **WHEN** it is emitted
- **THEN** the written value is `[redacted]`

#### Scenario: Exported logs

- **GIVEN** OpenTelemetry is initialised
- **WHEN** the same log call is emitted
- **THEN** the exported record also carries `[redacted]`

### Requirement: Traces Omit Query Strings And Client Addresses

HTTP spans SHALL NOT carry a URL query string or a client IP address in any attribute, so single-use tokens in links never reach the observability backend.

#### Scenario: Token in the URL

- **GIVEN** a request to `/verify-email?token=abc123`
- **WHEN** its span is exported
- **THEN** no attribute of the span contains `abc123` and the URL attributes end at the path

#### Scenario: Client address

- **GIVEN** a request that arrived through a proxy with an `X-Forwarded-For` header
- **WHEN** its span is exported
- **THEN** no attribute of the span holds an IP address

#### Scenario: Span name unchanged

- **GIVEN** the same request
- **WHEN** its span is exported
- **THEN** its name is still the method and the normalised path

## Environment variables

| Variable                 | Required | Default          | Description                                                                                          |
| ------------------------ | -------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_ENDPOINT` | No       | —                | Base URL of the OTLP collector (e.g., `http://otel-collector:4318`); omitting disables all telemetry |
| `OTEL_SERVICE_NAME`      | No       | `atu-ekartoteka` | Value of the `service.name` resource attribute                                                       |
| `K8S_NAMESPACE`          | No       | —                | Kubernetes namespace; sets `k8s.namespace.name` on all signals                                       |
| `K8S_POD_NAME`           | No       | —                | Kubernetes pod name; sets `k8s.pod.name` on all signals                                              |
| `LOG_LEVEL`              | No       | pino default     | Minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`)                               |
