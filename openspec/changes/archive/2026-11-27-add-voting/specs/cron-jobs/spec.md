# Spec Delta

## MODIFIED Requirements

### Requirement: Scheduled Cleanup Jobs

The system SHALL register three cleanup jobs when the server starts, each running every hour on the hour: one deleting expired email verification codes that were not verified, one deleting expired or used password reset tokens, and one deleting expired vote confirmations.

#### Scenario: Expired vote confirmations removed

- **GIVEN** a pending vote confirmation past its expiry
- **WHEN** the vote confirmation cleanup runs
- **THEN** it is deleted and unexpired confirmations are kept
