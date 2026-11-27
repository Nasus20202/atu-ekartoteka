# Voting (Głosowania)

Administrators run votes of the owners of one association. Each owner answers
from the dashboard and confirms the vote with a link sent to their email.

## How a voting works

A voting belongs to exactly one association and holds one to twenty questions.
Every question is answered **Za**, **Przeciw** or **Wstrzymał(a) się**. An
administrator can block abstaining for a whole voting; owners then choose only
**Za** or **Przeciw**, and the results list those two.

| Status     | Polish label   | Who sees it | What happens                                         |
| ---------- | -------------- | ----------- | ---------------------------------------------------- |
| `DRAFT`    | Wersja robocza | admins only | can be edited or deleted; meeting votes are entered  |
| `ACTIVE`   | Aktywne        | owners      | owners vote; questions can no longer change          |
| `CLOSED`   | Zakończone     | owners      | no more votes; owners see that it ended, not results |
| `ARCHIVED` | Zarchiwizowane | admins only | hidden from owners                                   |

The allowed moves are draft → active → closed → archived, and active →
archived. An optional **deadline** (Termin zakończenia) stops accepting votes at
that moment; the voting stays active until an admin moves it on.

Only administrators see results. Owners see the state of a voting and the
answers given for their own apartments.

## For administrators

1. Open **Głosowania** in the admin menu and choose **Nowe głosowanie**. The
   list can be shown as cards or a table, narrowed to an association or a
   status, and sorted.
2. Pick the association (type to narrow the list), write a title and the
   questions, and optionally set a deadline in the calendar; a day without a
   chosen time ends at 23:59. Tick **Zablokuj odpowiedź „Wstrzymał(a) się”**
   under the questions if owners must decide. Save: the voting is a draft nobody
   else can see.
3. If owners voted at a meeting, enter those votes on the draft under **Głosy z
   zebrania**: choose the apartment (search by address, number or owner), answer
   every question and **Zapisz głos**. Any active apartment can be entered, also
   one without an account. A wrong entry can be removed until you publish. While
   a draft has such votes, its association, questions and abstaining option
   cannot be changed.
4. Choose **Opublikuj**. Owners now see it on their dashboard and the other
   apartments can vote online.
5. Choose **Powiadom użytkowników** to email selected owners a link. The list
   shows each account with its apartments and their owners. Owners with
   an apartment that has not voted are preselected, so you can use it as a
   reminder.
6. Follow the turnout (ballots out of all active apartments) and the answers on
   the voting page. **Oddane głosy** lists every apartment with the voter and
   their answers; votes entered after a meeting are marked **Z zebrania**.
7. Choose **Zakończ głosowanie** to stop accepting votes, then **Zarchiwizuj**
   when it is done.

Votes are not secret: administrators see who voted what. Owners never do.

## For owners

An owner with an approved account sees a **Głosowania** link in the menu. A red
bell with a number means that many open votings still wait for their vote. The
dashboard has a card with the active votings. A closed voting leaves the
dashboard and stays under **Głosowania**.

1. Open the voting and answer every question. An owner of several apartments in
   the association answers each apartment separately; some can be left empty and
   voted later. A partly answered apartment has to be finished or cleared.
2. Choose **Dalej** and open the link sent to the account's email. The email and
   the page behind the link list the answers per apartment; choose **Potwierdź i
   zagłosuj** to cast the votes. Open the link while signed in as the same
   account, in any browser.
3. A confirmed vote is final. A vote cast at a meeting and entered by the
   administrator is shown on the voting page.

The link expires after 15 minutes and works once. Opening it does not vote, so
mail scanners that fetch links are harmless, and only the account it was sent to
can use it. A new link can be requested once per five minutes, the same limit
as the email verification link. SMTP must be configured (see
[Configuration](configuration.md)); without it the link is only written to the
development log.

## Developer notes

- Domain code is in `src/lib/voting/`, Server Actions in `src/actions/voting/`,
  components in `src/components/votings/`, pages under `src/app/admin/votings`
  and `src/app/dashboard/votings`.
- One ballot is stored per voting and apartment; a unique key in the database
  stops a second vote even for two parallel requests. A ballot without a user
  was entered after a meeting.
- Run the browser flow with
  `pnpm exec playwright test --project=chromium-integrations voting`.
- Metrics are recorded through
  `src/lib/platform/opentelemetry/voting-metrics.ts` (`ekartoteka.voting.*`) by
  the use cases and by the confirmation page loader
  (`src/app/dashboard/votings/confirm/[token]/vote-confirmation-loader.tsx`);
  the Voting row of `grafana/dashboards/ekartoteka.json` shows them. Add a
  label value only from a closed set, never an id.
- The emailed link is checked by `src/lib/voting/use-cases/resolve-vote-link.ts`,
  shared by the confirmation page (read-only) and `confirmVote`, which also
  removes expired or unreadable links.
- The behaviour is specified in `openspec/specs/voting/spec.md`; the metrics in
  `openspec/specs/observability/spec.md`.
