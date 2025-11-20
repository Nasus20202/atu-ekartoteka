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

### Docker (Development)

```bash
# Start all services
docker-compose up -d
```

### Docker (Production)

```bash
# Quick start
cp .env.prod.example .env.prod
# Edit .env.prod with your configuration
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

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
