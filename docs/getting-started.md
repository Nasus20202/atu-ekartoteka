# Getting started

How to get the app running on your machine and sign in as an administrator.

## Requirements

- **Node.js** - the version in `.node-version`.
- **pnpm** - the version is pinned in `package.json` (`packageManager`), so
  `corepack enable` is enough.
- **PostgreSQL** - the easiest way is the `db` service from
  `docker-compose.yaml`:

  ```bash
  docker compose up -d db
  ```

  It listens on `localhost:5432` with the user, password and database that
  `.env.example` already uses, and keeps its data in a Docker volume. Stop it
  with `docker compose stop db`. Use your own PostgreSQL instead if you have
  one, and point `DATABASE_URL` at it.

- **Local mocks** - a stand-in for email, Google sign-in and the captcha. The
  `.env.example` defaults use them:

  ```bash
  docker compose up -d db mocks
  ```

  Without Docker, run `pnpm mocks` in a second terminal. See
  [Testing](testing.md#local-mocks).

## Set up

```bash
pnpm install          # also generates the Prisma client
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL` - leave it if you use the compose database.
- `AUTH_SECRET` - any long random string: `openssl rand -base64 32`.

Everything else in `.env.example` is optional for local work. With the mocks
running, email is captured at http://localhost:4010/inbox, Google sign-in asks
for an email address instead of contacting Google, and the captcha uses
Cloudflare's test keys. The captcha widget script still loads from Cloudflare,
so the machine needs internet access for it. To use real services, see
[Configuration](configuration.md).

Create the tables and start the dev server:

```bash
pnpm db:migrate
pnpm dev
```

The app is on http://localhost:3000. Use `pnpm dev:pretty` if you want the JSON
logs formatted for reading.

## Create the first administrator

1. Open http://localhost:3000/register and register with any email and password.
2. Because no administrator exists yet, this account is created as an approved
   administrator. The email verification step does not block you from signing
   in.
3. Sign in, then open `/admin`. The admin panel has apartments, users, import
   and settings.

Accounts registered after that are `PENDING`. An administrator approves or
rejects them in the users list. Until approved, a resident can sign in but sees
no data.

## Put some data in

The fastest way to see real screens is to import one of the sample exports the
end-to-end tests use:

1. Go to `/admin/import` (**Import danych** in the admin panel).
2. Choose the folder `e2e/test-data/import/TEST02`. It has all four file types.
3. Click **Importuj**.

Do not pick the whole `e2e/test-data/import` folder: `TEST03` is deliberately
broken to exercise the error reports.

How the import works, and how to use it on a real export, is in
[Importing data](importing-data.md).

To see what a resident sees, create a second account, approve it as the admin,
and assign it an apartment from the apartments page (or invite owners from the
users page, which creates accounts from the emails stored on the apartments).

## Next

- [Development](development.md) for the project layout and day-to-day commands.
- [Testing](testing.md) before you open a pull request.
