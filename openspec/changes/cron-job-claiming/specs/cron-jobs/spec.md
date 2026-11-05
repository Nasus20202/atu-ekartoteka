# Spec Delta

## Purpose

Defines the scheduled background jobs the application runs and guarantees that each scheduled run executes at most once, however many replicas of the application are running.

## ADDED Requirements

### Requirement: Scheduled Cleanup Jobs

The system SHALL register two cleanup jobs when the server starts, each running every hour on the hour: one deleting expired email verification codes that were not verified, and one deleting expired or used password reset tokens.

#### Scenario: Jobs registered at startup

- **WHEN** the server starts
- **THEN** both cleanup jobs are scheduled with an hourly schedule

#### Scenario: Expired verification codes removed

- **GIVEN** an unverified email verification code past its expiry
- **WHEN** the verification cleanup runs
- **THEN** the code is deleted and verified or unexpired codes are kept

#### Scenario: Expired or used reset tokens removed

- **GIVEN** a password reset token that is expired or already used
- **WHEN** the password reset cleanup runs
- **THEN** the token is deleted and valid unused tokens are kept

### Requirement: Each Scheduled Run Executes Once

The system SHALL execute each scheduled run of a job on at most one replica. A replica SHALL claim a run by recording the job name and the scheduled time in a single atomic write, and SHALL execute the job only if its own write created the record.

#### Scenario: Several replicas, one execution

- **GIVEN** any number of replicas reach the same scheduled time of the same job
- **WHEN** they all try to claim the run at once
- **THEN** exactly one claims it and runs the job, and every other replica skips it

#### Scenario: Never run twice

- **GIVEN** a run that has been claimed
- **WHEN** another replica reaches that run later, even after the job has finished or the first replica has stopped
- **THEN** the claim is refused and the job is not run again

#### Scenario: Different jobs claim independently

- **GIVEN** two jobs scheduled for the same time
- **WHEN** replicas claim them
- **THEN** each job is claimed and run once

#### Scenario: Next scheduled time is a new run

- **GIVEN** a job that already ran for 10:00
- **WHEN** replicas reach 11:00
- **THEN** one replica claims and runs the 11:00 run

### Requirement: Claim Failure Skips the Run

The system SHALL NOT execute a job when claiming its run fails, and SHALL log the failure.

#### Scenario: Database unavailable while claiming

- **GIVEN** the claim write throws an error
- **WHEN** the scheduled time arrives
- **THEN** the job is not executed, the error is logged, and later runs still happen on schedule

### Requirement: Job Failure Does Not Retry

The system SHALL log a claimed job that throws, SHALL NOT run it again for the same scheduled time, and SHALL run it again at its next scheduled time.

#### Scenario: Claimed job throws

- **GIVEN** a replica claimed a run and the job throws
- **WHEN** the error occurs
- **THEN** it is logged with the job name and duration, no replica retries that run, and the next scheduled time runs normally

### Requirement: Claim Records Are Pruned

The system SHALL delete run records older than a retention period so the table does not grow without bound, and SHALL NOT delete the record of a run that could still be claimed.

#### Scenario: Old records removed

- **GIVEN** run records older than the retention period
- **WHEN** a replica successfully claims a run
- **THEN** the older records are deleted and recent ones are kept
