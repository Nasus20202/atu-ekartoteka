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
- **THEN** the error is logged at `error` level with the e-mail type and the underlying error, and no recipient address or subject; the metric is recorded with result `failure`; `sendEmail` resolves to `{ ok: false, reason: 'send-failed' }`

### Requirement: Email Templates

Every email type SHALL be built from shared React components and SHALL have a plain-text part generated from its rendered HTML. HTML emails SHALL share one layout and one theme derived from the website's design tokens, and the delivered HTML SHALL carry inline styles only.

#### Scenario: HTML rendering

- **GIVEN** an email type and its variables
- **WHEN** its message is built
- **THEN** the HTML is rendered from the shared layout with the variables inserted as escaped text, and no placeholder syntax remains in the result

#### Scenario: Template rendering

- **GIVEN** an email type and its variables
- **WHEN** its message is built
- **THEN** the plain-text part is generated from the rendered HTML, keeps heading case, shows each link once, puts detail labels on their own line and leaves out the brand header and the "copy this address" fallback; values are inserted literally

#### Scenario: Templates loaded at startup

- **GIVEN** the application starts
- **WHEN** an email is built
- **THEN** no template file is read or held in memory; HTML and text come from the same React components

#### Scenario: Shared theme

- **GIVEN** the website's foreground, primary, primary-foreground, muted, muted-foreground and border colours and its card, button and base corner radii
- **WHEN** the email theme is defined
- **THEN** the email theme equals those design tokens, so a change to a token fails the test suite until the theme follows; buttons use the application's primary button colours, size and shadow, and text uses the application's Geist fonts ahead of the system font stack

#### Scenario: Sender identity

- **GIVEN** `EMAIL_FROM_NAME` is set alongside `EMAIL_FROM`
- **WHEN** an email is sent
- **THEN** the `From` header uses the format `"<NAME>" <address>` (e.g., `"ATU Ekartoteka" <noreply@example.com>`)

### Requirement: Verification Email

The system SHALL send an email containing a verification link when a new user registers.

#### Scenario: Verification email dispatched

- **GIVEN** a new tenant registers via credentials
- **WHEN** the registration API creates the account
- **THEN** a `verification` email is sent to the user's address with subject "Potwierdź swój adres email" and a link of the form `{APP_URL}/verify-email?token={token}`

#### Scenario: Resend verification

- **GIVEN** the user requests a new verification link
- **WHEN** the signed-in user triggers the `resendVerificationAction` Server Action
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

### Requirement: Email Send Outcome

Every `EmailService` send method SHALL resolve to an `EmailSendResult` and SHALL NOT throw: `{ ok: true, delivery: 'sent' | 'skipped' }` or `{ ok: false, reason: 'send-failed' }`. `skipped` means SMTP is not configured and nothing was sent, which is not an error. A message that cannot be rendered is a `send-failed` result too. Callers SHALL branch on `ok` and log the `reason`. The password reset email is sent after the response (`after()`), so the response time does not include the SMTP round trip (a registered address still does one token transaction, which the unknown-address path does not). The app runs as a long-lived Node process (standalone build), so the deferred send completes; a serverless host would need the same `after()` contract to be honoured.

#### Scenario: SMTP failure is a failed result

- **GIVEN** the SMTP server rejects a message
- **WHEN** the caller sends the email
- **THEN** the service logs the failure, records a `failure` metric and resolves to `{ ok: false, reason: 'send-failed' }` without throwing

#### Scenario: SMTP is not configured

- **GIVEN** `SMTP_HOST` is not set
- **WHEN** the caller sends the email
- **THEN** nothing is sent, a `skipped` metric is recorded and the result is `{ ok: true, delivery: 'skipped' }`

#### Scenario: Message cannot be built

- **GIVEN** rendering the message throws
- **WHEN** the caller sends the email
- **THEN** the result is `{ ok: false, reason: 'send-failed' }` and nothing is sent

### Requirement: Account Activation Email

The system SHALL send the login email and a temporary password to users whose accounts are created by an admin via bulk creation.

#### Scenario: Activation email dispatched

- **GIVEN** an admin bulk-creates accounts for unassigned apartments
- **WHEN** each account is created
- **THEN** an `account_activation` email is sent with subject "Twoje konto zostało utworzone – ustaw nowe hasło", containing the recipient's email address, the temporary password and a link to `/login`
- **AND** accounts are created first, then the emails are sent in chunks of five at once and awaited; a result with `ok: false` is counted in the bulk result's `emailFailed` and logged, and does not undo the account

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

### Requirement: Vote Confirmation Email

The system SHALL email a voter a six-digit confirmation code before a ballot is counted. The message SHALL state that the code expires and that it must be ignored if the voter did not request it, and SHALL be recorded with email type `vote_confirmation`.

#### Scenario: Code requested

- **WHEN** a tenant submits a ballot
- **THEN** one email with the code is sent to the account's address
- **AND** the metric is recorded as `vote_confirmation`

### Requirement: Voting Notification Email

The system SHALL email an eligible user a notification that a voting is open, with a link to it, when an admin sends it. The message SHALL be recorded with email type `voting_notification`.

#### Scenario: Admin notifies users

- **WHEN** an admin notifies two eligible users about an active voting
- **THEN** each of them receives one email linking to the voting

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

### Requirement: Email Visual Style

Every HTML email SHALL share one layout that matches the application's visual design and ends with a link to the privacy policy.

#### Scenario: Shared design tokens

- **GIVEN** any of the five HTML templates
- **WHEN** it is rendered
- **THEN** it uses the application's primary colour, text colours and 0.5rem radius, a system sans-serif font stack, a white card on a muted page background, a header with the application name and a footer, with all styles inline and a table-based layout

#### Scenario: One call to action style

- **GIVEN** a template with an action link
- **WHEN** it is rendered
- **THEN** the action is a primary-coloured button regardless of email type, and the raw URL is shown below it as a fallback

#### Scenario: Narrow screens

- **GIVEN** a viewport of phone width
- **WHEN** an email is displayed
- **THEN** the card fills the width without horizontal scrolling

#### Scenario: Privacy policy link in every email

- **GIVEN** any of the five emails
- **WHEN** it is rendered
- **THEN** the footer contains a `Polityka prywatności` link to the application's absolute `/privacy` URL
- **AND** the plain-text part shows that URL once

#### Scenario: Account activation reaches people who never registered

- **GIVEN** an account activation email sent to an owner whose account an admin created
- **WHEN** it is rendered
- **THEN** it contains the privacy policy link, so the owner is informed where their data is described

#### Scenario: Text variant stays equivalent

- **GIVEN** a template pair
- **WHEN** it is rendered with the same variables
- **THEN** the plain-text variant contains every link and value that the HTML variant contains

## Email types

| Type                  | Subject (Polish)                                    | Trigger                                       |
| --------------------- | --------------------------------------------------- | --------------------------------------------- |
| `verification`        | Potwierdź swój adres email                          | New credentials registration, resend request  |
| `password_reset`      | Resetowanie hasła                                   | Forgot-password request                       |
| `account_approved`    | Twoje konto zostało zatwierdzone                    | Admin approves a tenant                       |
| `account_activation`  | Twoje konto zostało utworzone – ustaw nowe hasło    | Admin bulk-creates an account                 |
| `admin_notification`  | Nowa rejestracja użytkownika - wymaga zatwierdzenia | New self-registration or first Google sign-in |
| `vote_confirmation`   | Kod potwierdzający głosowanie                       | Tenant submits a ballot                       |
| `voting_notification` | Nowe głosowanie w Twojej wspólnocie                 | Admin notifies selected users about a voting  |

## Templates

Each email type is a React component in `src/components/email/emails/` built from the shared components in `src/components/email/` and the theme in `src/lib/platform/email/email-theme.ts`. The plain-text part is generated from the rendered HTML.

| Email type                    | Component file                    |
| ----------------------------- | --------------------------------- |
| `verification-email`          | `verification-email.tsx`          |
| `password-reset`              | `password-reset.tsx`              |
| `account-approved`            | `account-approved.tsx`            |
| `account-activation`          | `account-activation.tsx`          |
| `new-user-registration-admin` | `new-user-registration-admin.tsx` |
| `vote-confirmation`           | `vote-confirmation.tsx`           |
| `voting-notification`         | `voting-notification.tsx`         |

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
