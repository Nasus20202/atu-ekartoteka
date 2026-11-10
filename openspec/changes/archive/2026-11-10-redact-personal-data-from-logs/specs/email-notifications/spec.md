# Spec Delta

## MODIFIED Requirements

### Requirement: SMTP Transport

The system SHALL send email via a configurable SMTP server. When SMTP is not configured the system SHALL skip sending without raising an error.

#### Scenario: SMTP configured

- **GIVEN** the `SMTP_HOST` environment variable is set
- **WHEN** any email is dispatched
- **THEN** nodemailer connects to the SMTP server using `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, and `SMTP_PASS`; TLS certificate validation is enforced in production and skipped in development

#### Scenario: SMTP not configured

- **GIVEN** `SMTP_HOST` is absent or empty
- **WHEN** any send method is called
- **THEN** the email is silently skipped; the metric is recorded with result `skipped`; no error is thrown; the calling flow continues normally

#### Scenario: Send failure

- **GIVEN** SMTP is configured but the server rejects the message
- **WHEN** `sendEmail` is called
- **THEN** the error is logged at `error` level with the e-mail type and the underlying error, and no recipient address or subject; the metric is recorded with result `failure`; `sendEmail` returns `false`
