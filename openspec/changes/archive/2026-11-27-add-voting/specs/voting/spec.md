# Spec Delta

## Purpose

Lets an admin put a set of questions to the owners of one HOA and lets each apartment owner answer them from the dashboard, confirming the ballot with a one-time link sent by email.

## ADDED Requirements

### Requirement: Voting Structure

A voting SHALL belong to exactly one HOA, have a title, an optional description, an optional deadline and one to twenty ordered questions. Every question SHALL be answered with exactly one of `FOR` (Za), `AGAINST` (Przeciw) or `ABSTAIN` (Wstrzymał(a) się).

#### Scenario: Admin creates a voting

- **GIVEN** an approved admin
- **WHEN** they submit a title, an HOA and two questions
- **THEN** a voting in status `DRAFT` is created with the questions in the given order

#### Scenario: Invalid voting is rejected

- **WHEN** an admin submits a voting without a title, without questions, with more than twenty questions, with a blank question or with an unknown HOA
- **THEN** nothing is created and a Polish validation message is returned

### Requirement: Voting Lifecycle

A voting SHALL move through `DRAFT` (Wersja robocza), `ACTIVE` (Aktywne), `RESULTS_PUBLISHED` (Pokaż wyniki) and `ARCHIVED` (Zarchiwizowane). The allowed transitions SHALL be `DRAFT → ACTIVE`, `ACTIVE → RESULTS_PUBLISHED`, `ACTIVE → ARCHIVED` and `RESULTS_PUBLISHED → ARCHIVED`. Only a draft SHALL be editable or deletable.

#### Scenario: Draft is edited

- **GIVEN** a voting in `DRAFT`
- **WHEN** an admin changes its title and questions
- **THEN** the voting is updated and its questions are replaced

#### Scenario: Published voting cannot be edited

- **GIVEN** a voting in `ACTIVE`
- **WHEN** an admin tries to edit or delete it
- **THEN** the request is rejected and nothing changes

#### Scenario: Invalid transition is rejected

- **WHEN** an admin moves a voting from `ARCHIVED` to `ACTIVE`
- **THEN** the request is rejected and the status is unchanged

### Requirement: Tenant Visibility

A tenant SHALL see only `ACTIVE` and `RESULTS_PUBLISHED` votings of HOAs in which they own an apartment. Drafts, archived votings and votings of other HOAs SHALL be reported as not found.

#### Scenario: Draft is hidden

- **WHEN** a tenant opens a voting in `DRAFT`
- **THEN** a not-found page is shown and the voting is absent from their lists

#### Scenario: Foreign HOA is hidden

- **WHEN** a tenant opens an active voting of an HOA in which they own no apartment
- **THEN** a not-found page is shown

### Requirement: Eligibility and One Vote Per Apartment

An approved tenant SHALL cast one vote per active apartment they own in the voting's HOA. A vote on an apartment SHALL be final and the database SHALL reject a second ballot for the same voting and apartment.

#### Scenario: Owner of two apartments votes once

- **GIVEN** a tenant owning two eligible apartments
- **WHEN** they confirm a ballot
- **THEN** two ballots with the same answers are stored, one per apartment

#### Scenario: Second attempt

- **GIVEN** a tenant whose apartments have all voted
- **WHEN** they submit another ballot
- **THEN** it is rejected with a message that they have already voted

#### Scenario: Pending users and foreign owners

- **WHEN** an account that is not approved, or has no apartment in the HOA, submits a ballot
- **THEN** it is rejected and nothing is stored

### Requirement: Open Window

A ballot SHALL be accepted only while the voting is `ACTIVE` and its deadline, when set, has not passed. The deadline SHALL be checked when the link is requested and when it is confirmed.

#### Scenario: Deadline passed

- **GIVEN** an `ACTIVE` voting whose deadline is in the past
- **WHEN** a tenant submits or confirms a ballot
- **THEN** it is rejected and the tenant sees that voting has ended

### Requirement: Email Confirmation of a Ballot

A ballot SHALL be counted only after the voter opens a link emailed to the account address and confirms it while signed in. The link SHALL carry a random token of 256 bits, of which only the SHA-256 hash is stored; it SHALL expire after fifteen minutes and be usable once. Opening the link SHALL only show the stored answers; the ballot SHALL be cast by an explicit confirmation, so a mail scanner that fetches the link cannot vote. The link SHALL work only for the account it was issued to, and any other caller SHALL get the same answer as for an unknown link. A user SHALL receive at most one link per five minutes, across all votings, like the resend of the email verification link; a new link SHALL replace the previous one for the same voting, and a link that could not be emailed SHALL NOT count towards the limit.

#### Scenario: Link confirmed

- **GIVEN** a pending confirmation
- **WHEN** the owner opens the emailed link within fifteen minutes and confirms
- **THEN** the ballots are stored and the confirmation is deleted

#### Scenario: Link only opened

- **WHEN** the owner opens the emailed link without confirming
- **THEN** the answers are shown and no ballot is stored

#### Scenario: Someone else's or an unknown link

- **WHEN** another signed-in user opens the link, or the token is unknown or malformed
- **THEN** the page and the action answer that the link is invalid, and no ballot is stored
- **AND** the link stays usable for its owner

#### Scenario: Expired or reused link

- **WHEN** the owner opens the link after fifteen minutes or after it was already used
- **THEN** it is rejected without storing a ballot

#### Scenario: Resend too early

- **WHEN** the tenant asks for a new link less than five minutes after the previous one
- **THEN** the request is rejected with "Poczekaj N min przed ponownym wysłaniem linku" and no email is sent

#### Scenario: Email could not be sent

- **WHEN** the link email fails to send
- **THEN** the pending confirmation is removed, so the tenant may try again immediately

### Requirement: Answers Are Complete

A submitted ballot SHALL contain exactly one valid choice for every question of the voting and nothing else.

#### Scenario: Missing or foreign answer

- **WHEN** a ballot omits a question, answers an unknown question or uses an unknown choice
- **THEN** it is rejected before any link is sent

### Requirement: Results Visibility

An admin SHALL see, for every question, the count of each choice, the turnout and who voted what per apartment, at any status after publication. A tenant SHALL see aggregate counts, never individual voters, and only while the voting is `RESULTS_PUBLISHED`; while `ACTIVE` a tenant SHALL see only whether they have voted.

#### Scenario: Tenant before results are published

- **GIVEN** an `ACTIVE` voting
- **WHEN** a tenant opens it
- **THEN** no counts are shown

#### Scenario: Tenant after results are published

- **GIVEN** a voting in `RESULTS_PUBLISHED`
- **WHEN** a tenant opens it
- **THEN** they see the counts per question and no voter names

### Requirement: Notifying Users

An admin SHALL be able to email a notification about an active voting to selected eligible users. The recipients SHALL be limited to eligible users of the voting's HOA; ids that are not eligible SHALL be ignored.

#### Scenario: Reminder to those who have not voted

- **GIVEN** an active voting with three eligible users, one of whom has voted
- **WHEN** the admin opens the notify dialog
- **THEN** the two who have not voted are preselected

#### Scenario: Forged recipient

- **WHEN** a request lists a user who is not eligible
- **THEN** no email is sent to that user

#### Scenario: Not active

- **WHEN** an admin notifies about a draft or archived voting
- **THEN** the request is rejected

### Requirement: Navbar and Dashboard

The dashboard navbar SHALL show a "Głosowania" link with a bell badge counting the user's active, open votings in which at least one eligible apartment has not voted; the badge SHALL be absent at zero. The dashboard SHALL show a card listing those votings and the votings whose results are published.

#### Scenario: Open voting

- **GIVEN** an open voting the user has not voted in
- **WHEN** the user opens the dashboard
- **THEN** the navbar badge shows 1 and the card lists the voting

#### Scenario: Voted

- **WHEN** the user has voted in every open voting
- **THEN** the badge is absent

### Requirement: Access Control

Admin voting pages and actions SHALL require an approved admin checked in the database; tenant pages and actions SHALL require an approved account. The owner of a vote SHALL be taken from the session, never from the request.

#### Scenario: Tenant calls an admin action

- **WHEN** a tenant calls an admin voting action
- **THEN** it is denied and nothing changes

#### Scenario: Anonymous caller

- **WHEN** a signed-out caller calls a voting action
- **THEN** it is denied
