# ATU Ekartoteka

Homeowners association management system for tracking apartments, charges, and payments.

## Tech Stack

- **Next.js 16** with App Router
- **Prisma** with PostgreSQL
- **NextAuth.js** for authentication
- **shadcn/ui** + Tailwind CSS
- **Vitest** + Testing Library

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Set up database
pnpm db:migrate

# Start dev server
pnpm dev
```

Visit `http://localhost:3000/register` to create the first admin user.

## Environment variables

- Database (Postgres):
  - `DATABASE_URL` - Full Postgres connection string used by Prisma (production/development).
  - `DATABASE_REPLICA_URLS` - Optional comma-separated list of read replica connection strings for load distribution. When configured, all read queries (e.g., `findMany`, `findUnique`) are automatically routed to replicas, while writes go to the primary database.
  - `DATABASE_POOL_MAX` - Connections per database client (primary and each replica). Default: `10`.
  - `DATABASE_POOL_CONNECTION_TIMEOUT_MS` - Milliseconds a request waits for a free connection before failing. Default: `5000`.
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` - Used in docker-compose for provisioning the DB container.

- Auth.js:
  - `AUTH_URL` - App URL used by Auth.js (e.g., `http://localhost:3000` or your domain).
  - `AUTH_SECRET` - Secret used by Auth.js for session signing; always set in production. `NEXTAUTH_URL`/`NEXTAUTH_SECRET` are still read as a legacy fallback.
  - `AUTH_TRUST_HOST` - Optional; when set to `'true'`, trust host headers in proxied environments.

- Application runtime / build:
  - `NODE_ENV` - `development` or `production` (affects logs, email behavior, and more).
  - `APP_PORT` - Port the app listens on (used in Docker compose examples).
  - `APP_IMAGE` - For production Docker image definition.
  - `RUN_MIGRATIONS_ON_STARTUP` - If `true`, the app will attempt to run DB migrations at startup.

- Email (SMTP) - **Optional**: If `SMTP_HOST` is not configured, the application will skip sending emails and log them instead:
  - `EMAIL_FROM` - From email address used in outbound messages.
  - `EMAIL_FROM_NAME` - From display name.
  - `SMTP_HOST` - SMTP server hostname (required to enable email sending).
  - `SMTP_PORT` - SMTP server port (default: 465).
  - `SMTP_SECURE` - Use TLS/SSL (default: true).
  - `SMTP_USER` - SMTP authentication username.
  - `SMTP_PASS` - SMTP authentication password.

- Application URLs & client-side script:
  - `APP_URL` - Public URL used in email links and frontend redirection.
  - `TRACKING_SCRIPT` - Optional: JavaScript snippet that loads a tracking provider (for example Rybbit, Plausible or Umami). It is served from `/api/tracking`, read on each request, and cached by browsers for one hour. List the provider's domain in `TRACKING_ORIGINS` (be cautious; the snippet runs on every page).

- Security / process:
  - `LOG_LEVEL` - Optional: logging level used in production (e.g., `info`, `debug`).
  - `ENABLE_TEST_LOGS` - Optional: set `true` to enable logs while running tests.

- Cloudflare Turnstile (Captcha):
  - `TURNSTILE_SITE_KEY` - Client site key (public), used by the React widget.
  - `TURNSTILE_SECRET_KEY` - Server secret key for token verification.

- OpenTelemetry (optional):
  - `OTEL_EXPORTER_ENDPOINT` - OTLP HTTP endpoint for traces, metrics, and logs (e.g., `http://localhost:4318`). If not set, tracing is disabled.
  - `OTEL_SERVICE_NAME` - Service name for traces (defaults to `atu-ekartoteka`).
  - `K8S_NAMESPACE` - Kubernetes namespace (for metrics/traces resource attributes).
  - `K8S_POD_NAME` - Kubernetes pod name (for metrics/traces resource attributes).

Examples can be found in [`.env.example`](.env.example) and [`.env.docker.example`](.env.docker.example).

### Docker

```bash
# Copy environment file
cp .env.docker.example .env

# Edit .env with your SMTP and other settings
nano .env

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

See [Docker Documentation](docs/DOCKER.md) for detailed setup and troubleshooting.

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm test:perf` - Run k6 performance tests (seed the database with `perf/seed/seed-perf-data.ts` first)
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm db:migrate` - Run database migrations
- `pnpm db:deploy` - Deploy migrations (production)
- `pnpm test:e2e` - Run E2E tests
- `pnpm test:e2e:visual` - Run visual regression tests
- `pnpm test:e2e:visual:update` - Regenerate visual baselines after an intended UI change

## End-to-end tests

E2E runs need a running PostgreSQL server and `DATABASE_URL`, for example `postgresql://postgres:postgres@localhost:5432/e2e`. The functional suite uses database `e2e`, and the visual suite uses `e2e_visual` on the same server. Global setup creates both databases if they are missing and applies migrations.

`pnpm test:e2e` and `pnpm test:e2e:visual` build the app, then start that build three times with `next start`: on port 3000 for the functional suite, on port 3001 for the visual suite (`PLAYWRIGHT_VISUAL_BASE_URL` overrides the visual URL) and on port 3002 for the integration suite in `e2e/integrations` (`PLAYWRIGHT_INTEGRATIONS_BASE_URL`). The integration app has SMTP, Cloudflare Turnstile and Google sign-in turned on and pointed at a local mock server (`e2e/mocks`, started by Playwright: SMTP on 1025, HTTP on 4010) that captures emails, issues Google ID tokens and verifies Turnstile tokens. Run `pnpm build` first if you call `pnpm exec playwright test` directly.

`docker-compose.e2e.yaml` runs the same image the same way, with `ekartoteka` on port 3000, `ekartoteka-visual` on port 3001, `ekartoteka-integrations` on port 3002 and a `mocks` service (the `mocks` target of `docker/Dockerfile`, built on the same Node image as the app), and `docker/postgres-init` creates `e2e_visual`.

## Health Checks

The application provides health check endpoints for monitoring:

- `/api/health` - Combined health check (database + application)
- `/api/health/liveness` - Liveness probe (process running)
- `/api/health/readiness` - Readiness probe (ready to serve traffic, checks database)

## Features

- Multi-tenant system with homeowners associations
- User registration with admin approval
- Apartment management and ownership
- Charge tracking and payment processing
- Import from legacy system files (`.txt`, `.wmb` format)
- Role-based access (Admin/Tenant)

## How import works

Admins upload the legacy export in the admin panel, one folder per HOA. Then:

1. **Files are grouped by HOA** and recognised by name: `lok*.txt` (apartments and owners), `nal_czynsz*.txt` (charges), `pow_czynsz*.txt` (current charge notices, HOA header and footer), `wplaty*.txt` (payments and balances) and `.wmb` files (the date each export was made). A `.wmb` file goes to the data type of its name prefix (`lok*.wmb`, `nal_czynsz*.wmb`, `pow_czynsz*.wmb`, or the legacy `lokal_ost_wys.wmb`, `nalicz_ost_wys.wmb`, `pow_czynsz_ost_wys.wmb`). Its date is stored only when that type's `.txt` files are in the same import, and the newest date is used when there are several.
2. **Files are validated.** Money values, balances across years and duplicate records are checked, and problems are reported per file.
3. **Each HOA is written in one transaction**, in parallel with the others. Existing records are updated, or wiped first with the clean import option. If anything fails, that HOA is not changed at all.
4. **The result shows** how many records were created, updated, skipped or failed, plus the `.wmb` dates.

What the data is used for: apartments and owners decide who can see what, charges fill the `Naliczenia` pages, payments feed the `Wpłaty` pages and balance charts, notices appear on the dashboard, and the `.wmb` dates are only shown to admins. Tenants see months up to the current month, so the dashboard and charges lists end on the same month; admins always see everything.

The monthly charges and closing balances in `wplaty*.txt` are stored but never shown, because the exporter leaves settlement lines (`Wyrównanie zaliczek ...`) out of them. Monthly charges are summed from the charge records instead, and each year's closing balance is its imported opening balance plus payments minus those charges (up to the current month). Mismatches between the files are reported as import warnings, and the import page can re-run the same checks on the data already in the database (`Waliduj dane w bazie`).
