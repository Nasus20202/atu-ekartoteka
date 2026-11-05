# Spec Delta

## ADDED Requirements

### Requirement: E2E Mock Server

The repository SHALL contain a local mock server for E2E that Playwright and Docker Compose both start.

#### Scenario: Mock services

- **GIVEN** the mock server is running
- **WHEN** a test or the app talks to it
- **THEN** it provides an SMTP endpoint that stores received messages, an HTTP API to list and clear messages by recipient, an OIDC provider for Google sign-in, and the Turnstile siteverify endpoint

#### Scenario: Started with the suite

- **GIVEN** `pnpm test:e2e` is run locally
- **WHEN** Playwright starts its web servers
- **THEN** the mock server is started first and reused if already running; in Docker Compose it runs as its own service

#### Scenario: Browser-side Turnstile

- **GIVEN** a spec on the integrations app
- **WHEN** the page requests the Cloudflare widget script
- **THEN** Playwright serves a mock script that issues a valid or an invalid token, so the production CSP is unchanged
