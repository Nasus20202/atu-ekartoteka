# Capability: System Health

## Purpose

Provides health check endpoints for infrastructure monitoring, including liveness and readiness probes for container orchestration and uptime monitoring.

## Requirements

### Requirement: Combined Health Check

The system SHALL expose a combined health endpoint that reports overall application health including database connectivity.

#### Scenario: Healthy system

- **GIVEN** the application is running and the database is reachable
- **WHEN** `/api/health` is called
- **THEN** a 200 response is returned with a status indicating both application and database are healthy

#### Scenario: Database unavailable

- **GIVEN** the database is not reachable
- **WHEN** `/api/health` is called
- **THEN** a non-200 response is returned indicating degraded health

---

### Requirement: Liveness Probe

The system SHALL expose a liveness endpoint that confirms the process is running.

#### Scenario: Process alive

- **GIVEN** the application process is running
- **WHEN** `/api/health/liveness` is called
- **THEN** a 200 response is returned without checking external dependencies

---

### Requirement: Readiness Probe

The system SHALL expose a readiness endpoint that confirms the application is ready to serve traffic, including a database connectivity check.

#### Scenario: Application ready

- **GIVEN** the application has started and can reach the database
- **WHEN** `/api/health/readiness` is called
- **THEN** a 200 response is returned

#### Scenario: Application not ready

- **GIVEN** the database is not yet reachable (e.g., during startup)
- **WHEN** `/api/health/readiness` is called
- **THEN** a non-200 response is returned, signalling that traffic should not be routed to this instance

#### Scenario: Health checks excluded from tracing

- **GIVEN** OpenTelemetry tracing is enabled
- **WHEN** a health check endpoint is called
- **THEN** the request is not recorded as a trace span to avoid noise in observability data
