# Design

## Context

Authorization is resolved from the database on every check, mutations are
Server Actions that call one use case, and `src/lib` is split into layered
slice folders. Emails are React Email components sent through `EmailService`.
The voting feature follows those rules without new infrastructure.

## Decisions

### Data model

- `Voting(hoaId, title, description?, status, endsAt?)` with
  `VotingQuestion(votingId, position, text)`.
- A `VotingBallot` is one apartment's vote: unique `(votingId, apartmentId)` is
  the double-vote guard, enforced by the database. It stores `userId` (the
  admin may see who voted) and has one `VotingVote(ballotId, questionId,
choice)` per question, unique `(ballotId, questionId)`.
- Results are counted with `groupBy` in the database, never in JavaScript.

### Eligibility

A user may vote when the account is approved and owns at least one active
apartment of the voting's HOA that has no ballot yet. The set is recomputed
at submit and at confirm time, so an apartment reassigned in between cannot
vote and one apartment can never vote twice.

### Lifecycle

`DRAFT → ACTIVE → RESULTS_PUBLISHED → ARCHIVED`, plus `ACTIVE → ARCHIVED`.
Only a draft is editable or deletable, because ballots only exist after
publication. A voting is _open_ when it is `ACTIVE` and `endsAt` is empty or in
the future; the deadline is checked on every cast, so no job is needed.
Tenants see `ACTIVE` and `RESULTS_PUBLISHED` votings of HOAs they own an
apartment in; drafts and archived votings are 404 for them.

### Email confirmation

1. The tenant answers every question and submits. The use case validates the
   answers and the eligibility, stores a `VotingConfirmation` (the answers as
   JSON, the SHA-256 of `confirmationId:code`, `expiresAt`, `attempts`) and
   emails a six-digit code from `crypto.randomInt`. A previous pending
   confirmation of the same user and voting is replaced; a new code cannot be
   requested within a cooldown.
2. The tenant enters the code. The use case checks expiry, the attempt limit
   (the confirmation is deleted when it is reached), and compares hashes in
   constant time. A failed attempt is counted atomically in the database.
3. One transaction deletes the confirmation (single use) and creates one
   ballot per eligible apartment with its votes. The unique key rejects a
   concurrent duplicate.

The pending answers live only in the database, never in a token or URL.

### Notifications

The admin opens a dialog that lists eligible users (approved, owning an
apartment of the HOA) with those who have not voted preselected, and sends an
email to the selected ones. The use case re-resolves every selected id against
the eligible set, so a forged id is ignored. It only works for an active,
open voting. Logs identify users by id only.

### UI

Admin pages are server-rendered pages with client islands for forms. The
lists and the result bars use existing card, badge and tabs primitives.
Status changes and the stages of the ballot (answering, confirming, done) swap
through `ViewTransition`. The bell badge is computed in `DashboardChrome` and
passed to the navbar as a count.

## Risks / Trade-offs

- A six-digit code is guessable in principle: mitigated by 15-minute expiry,
  five attempts, a per-user replacement cooldown and the authenticated session.
- Admins see who voted what by requirement; this is documented in the admin UI.
