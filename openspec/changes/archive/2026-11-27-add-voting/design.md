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
   JSON, the SHA-256 of a 256-bit random token from `crypto.randomBytes`,
   `expiresAt`) and emails a link to `/dashboard/votings/confirm/<token>`. A
   previous pending confirmation of the same user and voting is replaced; a new
   link cannot be requested within five minutes (the same limit as the email
   verification resend).
2. The owner opens the link, signed in. The page shows the stored answers and a
   button; only the button's Server Action casts the ballot, so a mail scanner
   that prefetches the link changes nothing. The use case finds the
   confirmation by the hash of the token, requires that it belongs to the
   caller (anyone else gets the same answer as for an unknown link) and checks
   expiry.
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

- The link can be forwarded or end up in logs: mitigated by single use, a
  15-minute expiry, binding to the signed-in owner and storing only its hash.
  A 256-bit token cannot be guessed, so no attempt counter is needed.
- Opening the link on another device needs a sign-in there first; the link
  stays valid for its lifetime.
- Admins see who voted what by requirement; this is documented in the admin UI.
