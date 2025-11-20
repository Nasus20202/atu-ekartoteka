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
pnpm db:setup  # Creates admin user

# Start dev server
pnpm dev
```

### Docker

```bash
# Start with migrations
docker-compose up -d db
docker-compose up --build migrations
docker-compose up --build app

# Or auto-migrate on startup (set RUN_MIGRATIONS_ON_STARTUP=true in docker-compose.yml)
docker-compose up -d
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm test` - Run tests
- `pnpm lint:fix` - Fix linting issues
- `pnpm format` - Format code with Prettier
- `pnpm db:migrate` - Run database migrations
- `pnpm db:setup` - Initialize database with admin user

## Features

- Multi-tenant system with homeowners associations
- User registration with admin approval
- Apartment management and ownership
- Charge tracking and payment processing
- Import from legacy system files (`.txt`, `.wmb` format)
- Role-based access (Admin/Tenant)
