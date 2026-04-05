# Capability: Email Notifications

## Purpose

Provides transactional email delivery for all user-facing events: account lifecycle, authentication flows, and admin alerts. All emails are sent via SMTP using nodemailer and rendered from pre-compiled HTML + plain-text templates.

---

## Requirements

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
- **THEN** the error is logged at `error` level with recipient, subject, and the underlying error; the metric is recorded with result `failure`; `sendEmail` returns `false`

---

### Requirement: Email Templates

Every email type SHALL have an HTML template and a plain-text fallback, both loaded eagerly at module initialisation.

#### Scenario: Template rendering

- **GIVEN** a template name and a map of variable substitutions
- **WHEN** `renderEmailTemplate` is called
- **THEN** every `{{VARIABLE}}` placeholder in the template is replaced with the corresponding value; unreferenced placeholders remain untouched; the rendered string is returned

#### Scenario: Templates loaded at startup

- **GIVEN** the application starts
- **WHEN** `template-loader` is imported for the first time
- **THEN** all five template pairs are read from disk synchronously and held in memory; subsequent renders do not perform I/O

#### Scenario: Sender identity

- **GIVEN** `EMAIL_FROM_NAME` is set alongside `EMAIL_FROM`
- **WHEN** an email is sent
- **THEN** the `From` header uses the format `"<NAME>" <address>` (e.g., `"ATU Ekartoteka" <noreply@example.com>`)

---

### Requirement: Verification Email

The system SHALL send an email containing a verification link when a new user registers.

#### Scenario: Verification email dispatched

- **GIVEN** a new tenant registers via credentials
- **WHEN** the registration API creates the account
- **THEN** a `verification` email is sent to the user's address with subject "Potwierdź swój adres email" and a link of the form `{APP_URL}/verify-email?token={token}`

#### Scenario: Resend verification

- **GIVEN** the user requests a new verification link
- **WHEN** `/api/resend-verification` is called
- **THEN** a fresh token is generated and a new verification email is dispatched

---

### Requirement: Password Reset Email

The system SHALL send a password reset link when requested.

#### Scenario: Reset email dispatched

- **GIVEN** a user submits a forgot-password request for an existing email
- **WHEN** the API processes the request
- **THEN** a `password_reset` email is sent with subject "Resetowanie hasła" and a link of the form `{APP_URL}/reset-password?token={token}`

---

### Requirement: Account Approved Email

The system SHALL notify a tenant when an admin approves their account.

#### Scenario: Approval notification

- **GIVEN** an admin sets a tenant's status to `APPROVED`
- **WHEN** the status update is persisted
- **THEN** an `account_approved` email is sent to the tenant with subject "Twoje konto zostało zatwierdzone" and a link to `/login`

#### Scenario: Notification failure does not break approval

- **GIVEN** the email service fails to deliver the approval notification
- **WHEN** `notifyAccountApproved` catches the error
- **THEN** the error is logged but not re-thrown; the HTTP response to the admin confirms the approval regardless

---

### Requirement: Account Activation Email

The system SHALL send a temporary password to users whose accounts are created by an admin via bulk creation.

#### Scenario: Activation email dispatched

- **GIVEN** an admin bulk-creates accounts for unassigned apartments
- **WHEN** each account is created
- **THEN** an `account_activation` email is sent with subject "Twoje konto zostało utworzone – ustaw nowe hasło", containing the temporary password and a link to `/login`

---

### Requirement: Admin New-User Notification

The system SHALL notify all admins by email when a new user self-registers or signs in via Google for the first time.

#### Scenario: All admins notified

- **GIVEN** at least one admin user exists in the database
- **WHEN** a new tenant account is created (credentials registration or first Google sign-in)
- **THEN** an `admin_notification` email with subject "Nowa rejestracja użytkownika - wymaga zatwierdzenia" is sent to every user with role `ADMIN`; failures for individual admins are logged and do not prevent notification of the remaining admins

#### Scenario: No admins found

- **GIVEN** no admin users exist in the database
- **WHEN** `notifyAdminsOfNewUser` runs
- **THEN** a warning is logged and the function returns without error

#### Scenario: Notification is fire-and-forget

- **GIVEN** any code path that triggers an admin notification
- **WHEN** the notification call is made
- **THEN** it is awaited but its failure does not propagate to the caller (errors are caught internally)

---

### Requirement: Email Metrics

Every email send attempt SHALL be recorded as a metric.

#### Scenario: Successful send

- **GIVEN** an email is sent successfully
- **WHEN** `sendEmail` completes
- **THEN** `ekartoteka.email.sent` counter is incremented with attributes `type=<EmailType>` and `result=success`

#### Scenario: Failed send

- **GIVEN** the SMTP server rejects the message
- **WHEN** `sendEmail` catches the error
- **THEN** the counter is incremented with `result=failure`

#### Scenario: Skipped send

- **GIVEN** SMTP is not configured
- **WHEN** `sendEmail` is called
- **THEN** the counter is incremented with `result=skipped`

---

## Email types

| Type                 | Subject (Polish)                                    | Trigger                                       |
| -------------------- | --------------------------------------------------- | --------------------------------------------- |
| `verification`       | Potwierdź swój adres email                          | New credentials registration, resend request  |
| `password_reset`     | Resetowanie hasła                                   | Forgot-password request                       |
| `account_approved`   | Twoje konto zostało zatwierdzone                    | Admin approves a tenant                       |
| `account_activation` | Twoje konto zostało utworzone – ustaw nowe hasło    | Admin bulk-creates an account                 |
| `admin_notification` | Nowa rejestracja użytkownika - wymaga zatwierdzenia | New self-registration or first Google sign-in |

## Templates

Each email type has a matching pair of files in `src/lib/email/templates/`:

| Template name                 | Files                                                                 |
| ----------------------------- | --------------------------------------------------------------------- |
| `verification-email`          | `verification-email.html`, `verification-email.txt`                   |
| `password-reset`              | `password-reset.html`, `password-reset.txt`                           |
| `account-approved`            | `account-approved.html`, `account-approved.txt`                       |
| `account-activation`          | `account-activation.html`, `account-activation.txt`                   |
| `new-user-registration-admin` | `new-user-registration-admin.html`, `new-user-registration-admin.txt` |

## Environment variables

| Variable          | Required | Default                 | Description                                         |
| ----------------- | -------- | ----------------------- | --------------------------------------------------- |
| `SMTP_HOST`       | No       | —                       | SMTP server hostname; omitting disables email       |
| `SMTP_PORT`       | No       | `465`                   | SMTP server port                                    |
| `SMTP_SECURE`     | No       | `true`                  | `"true"` for TLS (port 465), `"false"` for STARTTLS |
| `SMTP_USER`       | No       | —                       | SMTP authentication username                        |
| `SMTP_PASS`       | No       | —                       | SMTP authentication password                        |
| `EMAIL_FROM`      | No       | `noreply@example.com`   | Sender address                                      |
| `EMAIL_FROM_NAME` | No       | —                       | Sender display name                                 |
| `APP_URL`         | No       | `http://localhost:3000` | Base URL used to build links in emails              |
