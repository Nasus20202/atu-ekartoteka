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
  - `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` - Used in docker-compose for provisioning the DB container.

- NextAuth / Authentication:
  - `NEXTAUTH_URL` - App URL used by NextAuth (e.g., `http://localhost:3000` or your domain).
  - `NEXTAUTH_SECRET` - Secret used by NextAuth for session signing; always set in production.
  - `AUTH_TRUST_HOST` - Optional; when set to `'true'`, trust host headers in proxied environments.

- Application runtime / build:
  - `NODE_ENV` - `development` or `production` (affects logs, email behavior, and more).
  - `APP_PORT` - Port the app listens on (used in Docker compose examples).
  - `APP_IMAGE` - For production Docker image definition.
  - `RUN_MIGRATIONS_ON_STARTUP` - If `true`, the app will attempt to run DB migrations at startup.

- Email (SMTP):
  - `EMAIL_FROM` - From email address used in outbound messages.
  - `EMAIL_FROM_NAME` - From display name.
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` - Standard SMTP configuration.

- Application URLs & client-side script:
  - `APP_URL` - Public URL used in email links and frontend redirection.
  - `TRACKING_SCRIPT` - Optional: inline script used to load tracking providers (be cautious; sanitized strings only).

- Security / process:
  - `LOG_LEVEL` - Optional: logging level used in production (e.g., `info`, `debug`).
  - `ENABLE_TEST_LOGS` - Optional: set `true` to enable logs while running tests.

- Cloudflare Turnstile (Captcha):
  - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` - Client site key (public), used by the React widget.
  - `TURNSTILE_SECRET_KEY` - Server secret key for token verification.

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
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm db:migrate` - Run database migrations
- `pnpm db:deploy` - Deploy migrations (production)

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
