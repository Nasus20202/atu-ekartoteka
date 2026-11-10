# Spec Delta

## ADDED Requirements

### Requirement: No Personal Data In Log Calls

ESLint SHALL fail on a logger call whose context object has a key that names personal data, so such fields cannot be added to logs unnoticed.

#### Scenario: Personal key is rejected

- **GIVEN** a call such as `logger.info({ email }, 'x')`, `logger.warn({ adminEmail: a }, 'x')`, `logger.error({ to }, 'x')` or one with a `token`, `password` or `ip` key, including shorthand properties
- **WHEN** ESLint runs
- **THEN** it reports an error naming the key

#### Scenario: Pseudonymous keys are allowed

- **GIVEN** a call with `userId`, `adminId`, `tokenLength`, `tokenFingerprint`, `hasName`, `mustChangePassword` or a task `task`
- **WHEN** ESLint runs
- **THEN** it reports nothing

#### Scenario: Tests are exempt

- **GIVEN** a test file that calls a mocked logger with a personal key
- **WHEN** ESLint runs
- **THEN** it reports nothing
