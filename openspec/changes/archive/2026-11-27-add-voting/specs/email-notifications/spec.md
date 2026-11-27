# Spec Delta

## ADDED Requirements

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
