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
  - `reason` (only on failure): one of `invalid_credentials`, `user_not_found`, `no_password`, `invalid_turnstile`, `missing_turnstile`, `google_error`

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

---

### Requirement: Email Metrics

Every email send attempt SHALL be counted (see also: `email-notifications/spec.md`).

#### Scenario: Email sent counter

- **GIVEN** `emailMetrics.recordEmailSent(type, result)` is called after any send attempt
- **WHEN** the metric is exported
- **THEN** the `ekartoteka.email.sent` counter is incremented with:
  - `type`: one of `verification`, `password_reset`, `account_approved`, `account_activation`, `admin_notification`, `other`
  - `result`: `success` | `failure` | `skipped`

---

### Requirement: Database Size Metrics

Row counts for core database tables SHALL be exposed as an observable gauge.

#### Scenario: Table row counts exported

- **GIVEN** OpenTelemetry is initialised
- **WHEN** the metric reader collects from the `ekartoteka.db.size` gauge
- **THEN** it returns the cached row count for each of the following tables, each as a separate data point with a `table` attribute:
  `homeownersAssociation`, `apartment`, `charge`, `chargeNotification`, `payment`, `user`

#### Scenario: Count refresh interval

- **GIVEN** the database metrics are registered
- **WHEN** 30 seconds elapse
- **THEN** fresh `COUNT(*)` queries are issued to the database for all tracked tables and the cache is updated

#### Scenario: Metric export interval

- **GIVEN** the `PeriodicExportingMetricReader` configuration
- **WHEN** the SDK is running
- **THEN** metrics are pushed to the OTLP endpoint every 60 seconds

---

## Environment variables

| Variable                 | Required | Default          | Description                                                                                          |
| ------------------------ | -------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_ENDPOINT` | No       | —                | Base URL of the OTLP collector (e.g., `http://otel-collector:4318`); omitting disables all telemetry |
| `OTEL_SERVICE_NAME`      | No       | `atu-ekartoteka` | Value of the `service.name` resource attribute                                                       |
| `K8S_NAMESPACE`          | No       | —                | Kubernetes namespace; sets `k8s.namespace.name` on all signals                                       |
| `K8S_POD_NAME`           | No       | —                | Kubernetes pod name; sets `k8s.pod.name` on all signals                                              |
| `LOG_LEVEL`              | No       | pino default     | Minimum log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`)                               |
