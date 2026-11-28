# Testing

| Kind                 | Tool                    | Where                     | Needs               |
| -------------------- | ----------------------- | ------------------------- | ------------------- |
| Unit and component   | Vitest, Testing Library | `__tests__/` next to code | nothing             |
| Browser (functional) | Playwright              | `e2e/`                    | PostgreSQL, a build |
| Visual               | Playwright snapshots    | `e2e/visual/`             | PostgreSQL, a build |
| Load                 | k6                      | `perf/`                   | the Docker stack    |

Write unit tests for business logic and every hook, and an e2e test for every
user flow. Unit coverage is enforced at 95%.

## Unit tests

```bash
pnpm test            # watch mode
pnpm test --run      # once
pnpm test:coverage   # once, with thresholds
```

Tests run in jsdom and do not need a database. Put a test in the
`__tests__` folder beside the file it covers.

A run must be silent. Anything a test prints through `stderr` or `stdout` — a
React `act` or suspension warning, a jsdom "not implemented", a Prisma error —
is a defect to fix, not noise to scroll past. Run `CI=1 pnpm test` to get the
whole log in one pass:

## Browser tests

The suites sign in as seeded users and click through the real app, started with
`next start` on a production build. They catch what unit tests cannot: broken
pages, wrong redirects, access rules, layout changes.

Specs are grouped by who uses the page and then by topic: `e2e/auth/`,
`e2e/dashboard/`, and `e2e/admin/<topic>/`. `e2e/integrations/` holds only the
flows that need a mocked service, such as email.

### Running

You need PostgreSQL, and `DATABASE_URL` in `.env` pointing at a server where
the tests may create databases, for example
`postgresql://postgres:postgres@localhost:5432/e2e`.

```bash
pnpm test:e2e              # Chromium: functional, admin, mobile, integrations, visual
pnpm test:e2e:visual       # visual projects only
pnpm test:e2e:firefox      # Firefox: functional, admin and phone-width tests
pnpm test:e2e:webkit       # WebKit (Safari engine): functional, admin and phone tests
pnpm test:e2e:ui           # Playwright UI mode
```

These scripts run `pnpm build` first. To run one project or one file, build
once and call Playwright directly:

```bash
pnpm build
pnpm exec playwright test --project=chromium e2e/dashboard/payments.spec.ts
pnpm exec playwright test --project=visual-desktop --grep "charges"
```

Run one browser at a time: all browsers share the same databases.

A failed run leaves traces and screenshots in `test-results/`. Open the report
with `pnpm exec playwright show-report`. If a run is killed, stop leftover
servers with `pkill -f "next start"`, otherwise the next run reuses them and
may serve an old build.

### How it is set up

Each Playwright project picks tests, a browser and an app instance:

| Project                    | Browser         | App port | Covers                                                 |
| -------------------------- | --------------- | -------- | ------------------------------------------------------ |
| `chromium`                 | Chromium        | 3000     | Resident and public pages                              |
| `chromium-admin`           | Chromium        | 3000     | Admin pages, users, import                             |
| `chromium-mobile`          | Chromium, phone | 3000     | Layout on a phone                                      |
| `chromium-integrations`    | Chromium        | 3002     | Email, Turnstile, Google sign-in against mock services |
| `visual-desktop`           | Chromium        | 3001     | Screenshots and PDFs against committed baselines       |
| `visual-mobile`            | Chromium, phone | 3001     | Screenshots on a phone                                 |
| `firefox`, `firefox-admin` | Firefox         | 3000     | Functional and admin tests again                       |
| `webkit`, `webkit-admin`   | WebKit (Safari) | 3000     | Functional and admin tests in the Safari engine        |
| `webkit-mobile`            | WebKit, phone   | 3000     | Layout on an iPhone                                    |
| `firefox-mobile`           | Firefox, phone  | 3000     | Layout at phone width (no touch emulation)             |

Three app instances run from the same build:

- **Functional** (3000, database `e2e`) has email, Turnstile and Google off, so
  tests do not depend on them.
- **Visual** (3001, database `e2e_visual`) accepts a fixed "now" so dates in
  screenshots do not change.
- **Integrations** (3002) has SMTP, Turnstile, Google and OpenTelemetry
  switched on and pointed at the mock server. The metrics specs
  (`opentelemetry-metrics`, `opentelemetry-voting-metrics` and
  `opentelemetry-admin-metrics`) run their flows,
  then wait for the first export that carries them. The server pushes metrics
  every 2 seconds (`OTEL_METRIC_EXPORT_INTERVAL` in `playwright.config.ts`)
  instead of every minute, so the wait is short.

Global setup creates both databases if missing, applies migrations, removes
earlier test data and seeds fresh data, so every run starts from the same
state. The seed SQL is in `e2e/test-data/seed/*.sql`; load it with `loadSql()`
instead of writing queries inline (ESLint enforces this). Sample import files are
in `e2e/test-data/import/`.

Projects run in parallel against one database, and some specs create their own
HOA and delete it when they finish (`e2e/utils/scroll-test-hoa.ts`). A test that
needs a HOA therefore opens the seeded one (`TEST_HOA` in
`e2e/utils/admin-apartments.ts`) instead of the first card in the list: a card
another spec owns can disappear between the render and the click, and the page
then shows "not found".

`e2e/fixtures.ts` wraps `page.goto`, so a navigation the browser aborts does not
fail the test: the wrapper waits for the navigation that won, then for streamed
content to settle and the page to hydrate. A server redirect and a soft
navigation the app is still running both abort the request; Chromium resolves
the redirected page, Firefox rejects it with `NS_ERROR_FAILURE`,
`NS_BINDING_ABORTED` or, when it has no message for the code, `<unknown error>`.

`e2e/mocks` is a small server Playwright starts for the integrations project: it
captures email (SMTP on port 1025), serves a sign-in form for Google's OpenID
endpoints and verifies Turnstile tokens, and receives OpenTelemetry exports as
OTLP/HTTP JSON at `/otlp/v1/{traces,metrics,logs}` (HTTP on port 4010). The specs
read them back from `/otlp/captured/{signal}`. It logs JSON lines to stdout; set
`LOG_LEVEL` (default `info`) to change how much. `pnpm mocks` runs it on its own.
Its dependencies are listed in
`e2e/mocks/package.json`; `docker/Dockerfile.mocks` exports only that package
with `pnpm deploy --prod`, so the image does not contain the app's dev
dependencies.

Visual comparisons run in Chromium only, because pixel output differs between
browsers.

### In CI

The `E2E` workflow runs one job per browser in parallel. Each job uploads its
report, and on failure its screenshots. `docker-compose.e2e.yaml` is the
production image run three times, plus the mocks and a database. The Chromium
job starts all of it; the Firefox and WebKit jobs run only functional projects,
so they start just the database and the main app (`services` in the matrix).
The `Build Docker Image` workflow builds the app and the mocks image in parallel
and uploads both, so the test jobs only load them.
The WebKit projects render at a device scale factor of 1: the Safari profiles
default to 2x and 3x, which software rendering on the runner cannot keep up
with (`e2e/config/webkit.ts`).
`docker compose -f docker-compose.e2e.yaml up --build --wait` runs the same stack
locally.

CI retries a failing test up to twice. `failOnFlakyTests` is enabled as well,
so a test that only passes on a retry still fails the job and the flake gets
fixed instead of staying hidden. Local runs do not retry, so nothing is marked
flaky there.

## Local mocks

The same server runs for local development, so the app can send mail, sign in
with Google and check the captcha without real accounts. `.env.example` points
at it:

```bash
docker compose up -d db mocks   # or: pnpm mocks
```

Compose publishes the mock ports on all network interfaces (`4010:4010` and
`1025:1025`), so other machines on the network can reach them.

> **Warning:** anyone on the network can read the captured mail, including the
> sign-in and password reset links in it. Use the mocks only on a network you
> trust, and stop them with `docker compose stop mocks` when you do not need
> them.

- **Email** - SMTP on `localhost:1025`. Open http://localhost:4010/inbox to read
  the captured mail, filter it by recipient or subject, and clear it.
- **Google sign-in** - the Google button opens a form at
  http://localhost:4010/google/authorize that asks for an email address and an
  optional name. One address is always the same Google account. An identity
  queued through `/google/identity` (the specs do this) takes priority over the
  form.
- **Captcha** - Cloudflare's test keys. The widget produces Cloudflare's dummy
  token, which the mock accepts. The site key `2x00000000000000000000AB` makes
  the widget fail every time, to try the refusal path. The widget script still
  loads from Cloudflare, so the machine needs internet access for it.

## Visual snapshots

Visual tests compare screenshots with images committed in
`e2e/visual/__screenshots__/`. The baselines are made on Linux, like CI, so
screenshots taken on macOS or Windows will differ.

After a deliberate UI change:

```bash
pnpm test:e2e:visual:update
```

Then look at every changed image and commit it with the code change that caused
it. A snapshot that changes without a code change is a regression, not a
baseline to update.

### PDF snapshots

`e2e/visual/pdf-documents.spec.ts` downloads each PDF the way a user does, by
clicking the real download button, renders every page to an image with
`pdfjs-dist` on a `@napi-rs/canvas` surface, and compares the image with the
stored one. Any change to layout, wording, font or numbers shows up as a diff.

The pages are rendered in Node, not in a browser, and the document date comes
from the frozen clock, so the output is the same on every run. Both libraries
are pinned to exact versions; after bumping either one, run this test before
merging.

To change a PDF on purpose: edit the component in `src/components/pdf`, run
`pnpm test:e2e:visual:update`, and check each changed page for the text, figures,
bold weight and Polish characters.

Known limit: amounts are set in proportional digits, so columns of figures do
not line up as in a bank statement.

## Load tests

`pnpm test:perf` runs `perf/load-test.ts` with k6 against a running stack seeded
with `perf/seed/seed-perf-data.ts` (a production-sized dataset). Peak load and
timing are in `perf/lib/config.ts`, latency limits in `perf/lib/thresholds.ts`.
CI runs it against the Docker image before publishing.
