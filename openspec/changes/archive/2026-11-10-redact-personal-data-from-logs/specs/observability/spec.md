# Spec Delta

## ADDED Requirements

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
