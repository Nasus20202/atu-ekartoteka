# Voting (Głosowania)

Administrators run votes of the owners of one association. Each owner answers
from the dashboard and confirms the vote with a link sent to their email.

## How a voting works

A voting belongs to exactly one association and holds one to twenty questions.
Every question is answered **Za**, **Przeciw** or **Wstrzymał(a) się**.

| Status              | Polish label   | Who sees it | What happens                                           |
| ------------------- | -------------- | ----------- | ------------------------------------------------------ |
| `DRAFT`             | Wersja robocza | admins only | the voting can be edited or deleted                    |
| `ACTIVE`            | Aktywne        | owners      | owners vote; questions can no longer change            |
| `RESULTS_PUBLISHED` | Pokaż wyniki   | owners      | voting is closed; owners see totals, not who voted how |
| `ARCHIVED`          | Zarchiwizowane | admins only | hidden from owners                                     |

The allowed moves are draft → active → results published → archived, and
active → archived. An optional **deadline** (Termin zakończenia) stops
accepting votes at that moment; the voting stays active until an admin moves it
on.

## For administrators

1. Open **Głosowania** in the admin menu and choose **Nowe głosowanie**.
2. Pick the association, write a title and the questions, and optionally set a
   deadline. Save: the voting is a draft nobody else can see.
3. Open it and choose **Opublikuj**. Owners now see it on their dashboard.
4. Choose **Powiadom użytkowników** to email selected owners a link. Owners who
   have not voted yet are preselected, so you can use it as a reminder.
5. Follow the turnout and the answers on the voting page. **Kto jak głosował**
   lists every apartment with the voter and their answers.
6. Choose **Pokaż wyniki** to close the voting and let owners see the totals,
   then **Zarchiwizuj** when it is done.

Votes are not secret: administrators see who voted what. Owners never do.

## For owners

An owner with an approved account sees a **Głosowania** link in the menu. A red
bell with a number means that many open votings still wait for their vote. The
dashboard has a card with the same list.

1. Open the voting and answer every question.
2. Choose **Dalej** and open the link sent to the account's email. It shows the
   answers; choose **Potwierdź i zagłosuj** to cast the vote. Open the link
   while signed in as the same account, in any browser.
3. The vote is final. An owner of several apartments in the association casts
   one vote per apartment, with the same answers, in one go.

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
  stops a second vote even for two parallel requests.
- Run the browser flow with
  `pnpm exec playwright test --project=chromium-integrations voting`.
- The behaviour is specified in `openspec/specs/voting/spec.md`.
