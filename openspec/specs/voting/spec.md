# Capability: Voting

## Purpose

Lets an admin put a set of questions to the owners of one HOA and lets each apartment owner answer them from the dashboard, confirming the ballot with a one-time link sent by email.

## Requirements

### Requirement: Voting Structure

A voting SHALL belong to exactly one HOA, have a title, an optional description, an optional deadline and one to twenty ordered questions. Every question SHALL be answered with exactly one of `FOR` (Za), `AGAINST` (Przeciw) or `ABSTAIN` (Wstrzymał(a) się), unless the voting blocks abstaining.

#### Scenario: Admin creates a voting

- **GIVEN** an approved admin
- **WHEN** they submit a title, an HOA and two questions
- **THEN** a voting in status `DRAFT` is created with the questions in the given order

#### Scenario: Invalid voting is rejected

- **WHEN** an admin submits a voting without a title, without questions, with more than twenty questions, with a blank question or with an unknown HOA
- **THEN** nothing is created and a Polish validation message is returned

### Requirement: Abstaining Can Be Blocked

An admin SHALL be able to block `ABSTAIN` for a whole voting while it is a draft; it is allowed by default. A voting that blocks it SHALL offer and accept only `FOR` and `AGAINST`, SHALL leave abstaining out of its results and SHALL say on its summary that abstaining is not possible.

#### Scenario: Ballot of a voting that blocks it

- **GIVEN** an active voting that blocks abstaining
- **WHEN** an owner opens it
- **THEN** each question offers `Za` and `Przeciw` only

#### Scenario: Abstention sent anyway

- **GIVEN** a voting that blocks abstaining
- **WHEN** an abstention is submitted or confirmed
- **THEN** it is rejected and no ballot is stored

#### Scenario: Results

- **GIVEN** a voting that blocks abstaining
- **WHEN** its results are shown
- **THEN** they list `Za` and `Przeciw` only

### Requirement: Voting Lifecycle

A voting SHALL move through `DRAFT` (Wersja robocza), `ACTIVE` (Aktywne), `CLOSED` (Zakończone) and `ARCHIVED` (Zarchiwizowane). The allowed transitions SHALL be `DRAFT → ACTIVE`, `ACTIVE → CLOSED`, `ACTIVE → ARCHIVED` and `CLOSED → ARCHIVED`. A closed voting SHALL accept no ballot. Only a draft SHALL be editable or deletable.

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

### Requirement: Admin Voting List

The page `/admin/votings` SHALL show the votings as cards or as the table `Głosowania`, remembering the chosen view. The admin SHALL be able to narrow them to one HOA and to one status, and to order them by title, HOA, status, number of questions, number of ballots, deadline or creation date, in either direction: by the column headings of the table, or by the select `Sortowanie` above the cards.

#### Scenario: Filtered by status

- **GIVEN** drafts and active votings
- **WHEN** the admin chooses the status `Wersja robocza`
- **THEN** only the drafts are listed and the address names the status

#### Scenario: Nothing matches

- **GIVEN** filters that match no voting
- **WHEN** the list renders
- **THEN** it says that no voting matches and offers `Wyczyść filtry`

### Requirement: Admin Voting List Query

The filters and the order of the admin voting list SHALL be applied by the database query and named by the `hoa`, `status`, `sort` and `order` query parameters; unknown values SHALL be ignored. By default the newest votings come first, and a voting without a deadline SHALL follow the dated ones when ordered by deadline.

#### Scenario: Unknown value

- **GIVEN** an address with an unknown `status`
- **WHEN** the page is opened
- **THEN** votings of every status are listed, newest first

### Requirement: Voting Form Pickers

The voting form SHALL offer the HOA as a list that is narrowed by typing a name or identifier, searched by the database. The deadline SHALL be picked in a Polish calendar that starts the week on Monday, with typed hours and minutes; a newly picked day SHALL end at 23:59, and `Wyczyść` SHALL remove the deadline.

#### Scenario: HOA found by typing

- **GIVEN** many associations
- **WHEN** the admin types part of a name in `Szukaj wspólnoty`
- **THEN** only the matching associations are offered and Enter chooses the highlighted one

#### Scenario: Deadline by day

- **GIVEN** a voting without a deadline
- **WHEN** the admin picks a day and no time
- **THEN** the deadline is 23:59 of that day in the browser's time zone

### Requirement: Tenant Visibility

A tenant SHALL see only `ACTIVE` and `CLOSED` votings of HOAs in which they own an apartment. Drafts, archived votings and votings of other HOAs SHALL be reported as not found.

#### Scenario: Draft is hidden

- **WHEN** a tenant opens a voting in `DRAFT`
- **THEN** a not-found page is shown and the voting is absent from their lists

#### Scenario: Foreign HOA is hidden

- **WHEN** a tenant opens an active voting of an HOA in which they own no apartment
- **THEN** a not-found page is shown

### Requirement: Eligibility and One Vote Per Apartment

An approved tenant SHALL cast one vote per active apartment they own in the voting's HOA, each apartment with its own answers. A vote on an apartment SHALL be final once the voting is published, and the database SHALL reject a second ballot for the same voting and apartment.

#### Scenario: Owner of two apartments votes differently

- **GIVEN** a tenant owning two eligible apartments
- **WHEN** they answer each apartment separately and confirm
- **THEN** two ballots are stored, each with the answers given for its apartment

#### Scenario: One apartment now, the other later

- **GIVEN** a tenant owning two eligible apartments
- **WHEN** they answer only one of them and confirm
- **THEN** one ballot is stored and the other apartment can still vote

#### Scenario: Unfinished apartment

- **WHEN** a tenant answers all questions for one apartment and only some for another
- **THEN** the ballot cannot be sent until the other one is finished or cleared

#### Scenario: Second attempt

- **GIVEN** a tenant whose apartments have all voted
- **WHEN** they submit another ballot
- **THEN** it is rejected with a message that they have already voted

#### Scenario: Pending users and foreign owners

- **WHEN** an account that is not approved, or has no apartment in the HOA, submits a ballot, or a ballot names an apartment the tenant does not own
- **THEN** it is rejected and nothing is stored

### Requirement: Meeting Ballots

While a voting is a draft, an admin SHALL be able to enter the vote an apartment cast at a meeting, and to remove it. Any active apartment of the HOA without a ballot SHALL be selectable, with or without an account, by searching its address, number or owner. The ballot SHALL answer every question with an accepted choice and SHALL be stored without a user.

#### Scenario: Entered vote

- **GIVEN** a draft voting
- **WHEN** an admin chooses an apartment, answers every question and saves
- **THEN** the ballot is listed under `Głosy z zebrania` and the apartment is no longer offered

#### Scenario: Owner of an apartment that voted at a meeting

- **GIVEN** a published voting with a meeting ballot for a tenant's apartment
- **WHEN** the tenant opens it
- **THEN** they see those answers marked as cast at a meeting and cannot vote for that apartment again

#### Scenario: Published voting

- **GIVEN** a voting that is not a draft
- **WHEN** an admin tries to enter or remove a meeting ballot
- **THEN** it is rejected and nothing changes

#### Scenario: Forged input

- **WHEN** a ballot names an apartment of another HOA, an inactive one or one that already voted, or a request comes from a non-admin
- **THEN** it is rejected and nothing is stored

### Requirement: Draft With Ballots Is Locked

While a draft has meeting ballots, its HOA, its questions and whether abstaining is blocked SHALL NOT change, and the form SHALL say why. The title, the description and the deadline SHALL stay editable, and saving SHALL keep the ballots.

#### Scenario: Question changed

- **GIVEN** a draft with a meeting ballot
- **WHEN** an admin saves other questions
- **THEN** the change is rejected and the ballots are kept

#### Scenario: Ballots removed

- **GIVEN** a draft whose meeting ballots were all removed
- **WHEN** the admin edits it
- **THEN** everything can be changed again

### Requirement: Open Window

A ballot SHALL be accepted only while the voting is `ACTIVE` and its deadline, when set, has not passed. The deadline SHALL be checked when the link is requested and when it is confirmed.

#### Scenario: Deadline passed

- **GIVEN** an `ACTIVE` voting whose deadline is in the past
- **WHEN** a tenant submits or confirms a ballot
- **THEN** it is rejected and the tenant sees that voting has ended

### Requirement: Email Confirmation of a Ballot

A ballot SHALL be counted only after the voter opens a link emailed to the account address and confirms it while signed in. The link SHALL carry a random token of 256 bits, of which only the SHA-256 hash is stored; it SHALL expire after fifteen minutes and be usable once. The email and the page behind the link SHALL list the answers per apartment. Opening the link SHALL only show them; the ballot SHALL be cast by an explicit confirmation, so a mail scanner that fetches the link cannot vote.

#### Scenario: Link confirmed

- **GIVEN** a pending confirmation
- **WHEN** the owner opens the emailed link within fifteen minutes and confirms
- **THEN** the ballots are stored and the confirmation is deleted

#### Scenario: Link only opened

- **WHEN** the owner opens the emailed link without confirming
- **THEN** the answers are shown and no ballot is stored

#### Scenario: Expired or reused link

- **WHEN** the owner opens the link after fifteen minutes or after it was already used
- **THEN** it is rejected without storing a ballot

### Requirement: Confirmation Link Ownership

The link SHALL work only for the account it was issued to, and any other caller SHALL get the same answer as for an unknown link.

#### Scenario: Someone else's or an unknown link

- **WHEN** another signed-in user opens the link, or the token is unknown or malformed
- **THEN** the page and the action answer that the link is invalid, and no ballot is stored
- **AND** the link stays usable for its owner

### Requirement: Confirmation Link Limit

A user SHALL receive at most one link per five minutes, across all votings, like the resend of the email verification link; a new link SHALL replace the previous one for the same voting, and a link that could not be emailed SHALL NOT count towards the limit.

#### Scenario: Resend too early

- **WHEN** the tenant asks for a new link less than five minutes after the previous one
- **THEN** the request is rejected with "Poczekaj N min przed ponownym wysłaniem linku" and no email is sent

#### Scenario: Email could not be sent

- **WHEN** the link email fails to send
- **THEN** the pending confirmation is removed, so the tenant may try again immediately

### Requirement: Answers Are Complete

A submitted ballot SHALL name at least one of the voter's apartments that may still vote and, for each named apartment, contain exactly one valid choice for every question of the voting and nothing else.

#### Scenario: Missing or foreign answer

- **WHEN** a ballot names no apartment or an unavailable one, omits a question, answers an unknown question or uses an unknown choice
- **THEN** it is rejected before any link is sent

### Requirement: Answers Are Told Apart

Wherever answers are shown, `Za`, `Przeciw` and `Wstrzymał(a) się` SHALL each have its own icon and colour (green check, red cross, amber minus), and the answer SHALL also be written in words.

#### Scenario: Own answers

- **GIVEN** an owner who voted `Za` on one question and `Przeciw` on another
- **WHEN** they open the voting
- **THEN** the two answers carry different icons and colours

### Requirement: Results Visibility

Results SHALL be shown to admins only. An admin SHALL see, for every question, the count of each choice, the turnout and who voted what per apartment (the tab `Oddane głosy`), at any status after publication. The turnout SHALL be the ballots divided by the active apartments of the HOA. A tenant SHALL never see counts or other voters: only the state of the voting and the answers given for their own apartments.

#### Scenario: Tenant of an active voting

- **GIVEN** an `ACTIVE` voting
- **WHEN** a tenant opens it
- **THEN** no counts are shown

#### Scenario: Tenant of a closed voting

- **GIVEN** a voting in `CLOSED`
- **WHEN** a tenant opens it
- **THEN** they see that it has ended and their own answers, and no counts

#### Scenario: Ballots of a meeting in the results

- **GIVEN** ballots entered after a meeting
- **WHEN** an admin opens the results
- **THEN** they are counted, and the voter list names the apartment's owner and marks them `Z zebrania`

### Requirement: Notifying Users

An admin SHALL be able to email a notification about an active voting to selected eligible users. The recipients SHALL be limited to eligible users of the voting's HOA; ids that are not eligible SHALL be ignored. The dialog SHALL show for every user their active apartments in the HOA, each with the owner recorded for it.

#### Scenario: Accounts with alike names

- **WHEN** the admin opens the notify dialog
- **THEN** every user is listed with their apartments as `address building/number – owner`

#### Scenario: Reminder to those who have not voted

- **GIVEN** an active voting with three eligible users, the apartments of one of whom have all voted, online or at a meeting
- **WHEN** the admin opens the notify dialog
- **THEN** the two who have not voted are preselected

#### Scenario: Forged recipient

- **WHEN** a request lists a user who is not eligible
- **THEN** no email is sent to that user

#### Scenario: Not active

- **WHEN** an admin notifies about a draft or archived voting
- **THEN** the request is rejected

### Requirement: Navbar and Dashboard

The dashboard navbar SHALL show a "Głosowania" link with a bell badge counting the user's active, open votings in which at least one eligible apartment has not voted; the badge SHALL be absent at zero. The dashboard SHALL show a card listing the active votings visible to the user, saying in a Polish sentence how many of them wait for the user's vote; a closed voting SHALL NOT appear on the dashboard.

#### Scenario: Open voting

- **GIVEN** an open voting the user has not voted in
- **WHEN** the user opens the dashboard
- **THEN** the navbar badge shows 1 and the card lists the voting

#### Scenario: Voted

- **WHEN** the user has voted in every open voting
- **THEN** the badge is absent

#### Scenario: Closed voting

- **WHEN** a voting is closed
- **THEN** it is not on the dashboard and stays on the votings page

### Requirement: Access Control

Admin voting pages and actions SHALL require an approved admin checked in the database; tenant pages and actions SHALL require an approved account. The owner of a vote SHALL be taken from the session, never from the request.

#### Scenario: Tenant calls an admin action

- **WHEN** a tenant calls an admin voting action
- **THEN** it is denied and nothing changes

#### Scenario: Anonymous caller

- **WHEN** a signed-out caller calls a voting action
- **THEN** it is denied
