# Proposal

## Why

Homeowners' associations decide things by vote (uchwały), but the application
has no way to run one: admins collect votes outside the system, and tenants
have no place to see what is being decided or what came out. A built-in
"Głosowania" section lets an admin put a set of questions to one HOA, lets each
apartment owner answer from the dashboard, and proves the voter's identity with
a one-time code sent by email.

## What Changes

- Add a `Voting` (Głosowanie) that belongs to exactly one HOA and holds an
  ordered set of questions. Every question is answered **Za**, **Przeciw** or
  **Wstrzymał(a) się**.
- Add a lifecycle: **Wersja robocza** (draft, invisible to tenants, editable)
  → **Aktywne** (tenants vote) → **Pokaż wyniki** (tenants see aggregate
  results) → **Zarchiwizowane** (hidden from tenants). An optional deadline
  closes an active voting automatically.
- Add an admin area `/admin/votings`: list, create, edit (drafts only), delete
  (drafts only), status changes, per-question results, who voted what, and a
  dialog that emails a notification to selected eligible users.
- Add a tenant area `/dashboard/votings`: list, a ballot form, and results once
  the admin publishes them.
- Add a one-vote-per-apartment rule: a voter casts the answers for every
  eligible apartment they own in the voting's HOA in one confirmed ballot.
- Confirm a ballot with a single-use, short-lived, attempt-limited six-digit
  code emailed to the voter; only a confirmed ballot is counted.
- Add a "Głosowania" navbar link with a bell badge counting the active
  votings the user has not finished voting in, and a dashboard card listing
  them.
- Add two emails: the confirmation code and the voting notification.

## Out of Scope

- Weighting votes by ownership share (`shareRatio`); every apartment counts as
  one vote.
- Changing or withdrawing a confirmed vote.
- Quorum rules, legal minutes (protokół) or PDF export of results.
- Voting on behalf of another owner (pełnomocnictwo).
- Secret ballots: the admin can see who voted what, by requirement.

## Capabilities

### New Capabilities

- `voting`: votings, questions, lifecycle, eligibility, ballots, email
  confirmation, results visibility, notifications, navbar badge and dashboard
  card.

### Modified Capabilities

- `email-notifications`: two new email types, `vote_confirmation` and
  `voting_notification`.

## Impact

- `prisma/schema.prisma` and a migration: `Voting`, `VotingQuestion`,
  `VotingBallot`, `VotingVote`, `VotingConfirmation`, enums `VotingStatus`,
  `VoteChoice`.
- New slice `src/lib/voting/`, actions in `src/actions/voting/`, routes under
  `src/app/admin/votings` and `src/app/dashboard/votings`, components in
  `src/components/votings/`.
- Navbar, dashboard page, email service, email metrics types, page titles.
- `openspec/config.yaml` spec index, `docs/` pages, E2E tests.
