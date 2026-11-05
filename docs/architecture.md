# Architecture

## The pieces

- **Next.js 16** (App Router, standalone build) serves pages and API routes.
  Pages are server components that read the database directly. Client
  components are used only where a page needs state or browser APIs: forms,
  charts, the import uploader, PDF buttons.
- **PostgreSQL** through **Prisma 7** with the `pg` adapter. Money columns are
  `Decimal`, never floats. If `DATABASE_REPLICA_URLS` is set, a Prisma extension
  sends reads to the replicas.
- **Auth.js v5** with a credentials provider (email and password) and optional
  Google. Sessions are JWTs.
- **Nodemailer** sends email over SMTP. Message bodies are React Email
  components.
- **Cloudflare Turnstile** protects register, login and password reset.
- **node-cron** runs the hourly cleanup jobs inside the app process.
- **OpenTelemetry** exports traces, metrics and logs when an endpoint is set.
  Logging itself is pino.
- **`@react-pdf/renderer`** builds the PDFs in the browser.

## The data model

Defined in `prisma/schema.prisma`:

- `HomeownersAssociation` (HOA) - an association, identified by the ID from the
  legacy system (`externalId`). Holds the notice header and footer and the
  `.wmb` data dates.
- `Apartment` - belongs to one HOA, optionally to one `User`. Identified by
  legacy owner ID plus legacy apartment ID. Can be inactive.
- `Charge`, `ChargeNotification`, `Payment` - per apartment: monthly charge
  lines, the current notice lines, and one row per year with monthly payments.
- `User` - role `ADMIN` or `TENANT`, status `PENDING`, `APPROVED` or
  `REJECTED`.
- `EmailVerification`, `PasswordReset` - single-use, expiring tokens.
- `AppSettings` - one row of admin settings (how many previous years residents
  see).
- `CronRun` - claims for scheduled runs, so each tick runs once across
  instances.

Imported charge and payment figures that the legacy exporter gets wrong are
stored in columns prefixed `legacy`. They are imported and validated, but
screens and queries use figures derived from the charge lines instead. A lint
rule keeps `legacy*` names out of everything but the import and the payment
queries. [Importing data](importing-data.md) explains why.

## How a request is handled

1. **`src/proxy.ts`** runs on almost every request. It adds the security
   headers (CSP, HSTS, frame and content-type protection) and redirects users
   who must change their password to `/change-password`. That redirect uses a
   flag in the session token as a hint only.
2. **Pages and layouts** call `getSession()`. Anonymous visitors are redirected
   to `/login`. Everything under `/admin` also checks, against the database,
   that the user is an approved admin, and redirects others to `/dashboard`.
3. **API routes** start with `requireUser()` or `requireAdmin()` and return
   its 401 or 403 response before doing any work.
4. **Server Actions** (`src/actions/`) handle browser mutations. Each module
   starts with `requireUserAction()` or `requireAdminAction()`. Actions are
   public POST endpoints, so they validate their own arguments.
5. **Queries** (`src/lib/queries`) and **mutations** (`src/lib/mutations`) hold
   the database access. Tenant queries are scoped to the signed-in user's own
   apartments; the owner is always taken from the session, never from the URL
   or request body.

The import (and the database validation next to it) is the exception: it
posts a gzipped JSON body to `/api/admin/import` instead of calling a Server
Action.

## Authorization

The session token carries only the user ID and a `mustChangePassword` flag.
Role and account status are read from the database on every check, through the
helpers in `src/lib/auth` (`isApprovedAdmin`, `isApprovedAccount` and similar).
Consequences:

- Approving, rejecting or demoting someone takes effect on their next request,
  not when their token expires.
- Code never compares `role` or `status` directly. A lint rule enforces this, so
  a new status is denied until it is added to the helpers on purpose.
- A pending or rejected user can sign in, but sees no tenant data.

## Where things are

| What                           | Where                                     |
| ------------------------------ | ----------------------------------------- |
| Pages and API routes           | `src/app/`                                |
| Server Actions                 | `src/actions/<feature>/`                  |
| Feature components             | `src/components/<feature>/`               |
| shadcn/ui primitives           | `src/components/ui/`                      |
| Database queries and mutations | `src/lib/queries`, `src/lib/mutations`    |
| Auth config and guards         | `src/auth.ts`, `src/lib/auth/`            |
| Import pipeline and parsers    | `src/lib/import/`, `src/lib/parsers/`     |
| Scheduled jobs                 | `src/lib/cron/`                           |
| Email components and sending   | `src/components/email/`, `src/lib/email/` |
| PDF documents                  | `src/components/pdf/`, `src/lib/pdf/`     |
| Custom lint rules              | `eslint-rules/`                           |
| Schema and migrations          | `prisma/`                                 |
| Behaviour specifications       | `openspec/specs/`                         |

## PDFs

Residents download three PDFs: charges for a month, payments for a year, and
the current notice. They are generated in the browser, on demand, from
`@react-pdf/renderer` components in `src/components/pdf`. The PDF library is
loaded only when someone clicks a download button, so it does not weigh on the
first page load.

Text is set in Geist (regular and bold, files in `public/fonts`), registered in
`src/lib/pdf/register-fonts.ts`. react-pdf cannot synthesise bold, so each
weight is a separate file. The date printed on a document is the browser's
clock.

How the PDFs are checked is in [Testing](testing.md#pdf-snapshots).
