# ATU Ekartoteka

A web app for homeowners associations (wspólnoty mieszkaniowe). It keeps
apartments, owners, monthly charges and payments for each association, and lets
residents check their own balance online. The interface is in Polish.

- **Residents** sign in and see only their own apartments: charges, payments,
  balance history, and PDFs of each.
- **Administrators** approve new accounts, manage associations, apartments and
  users, and import the data exported from the legacy accounting system.

Data comes from the legacy system, not from manual entry. The import is the
main way charges and payments get into the app, so
[Importing data](docs/importing-data.md) is the page to read first if you
operate it.

## Run it locally

You need Node.js (see `.node-version`), pnpm and Docker (or your own PostgreSQL).

```bash
docker compose up -d db  # PostgreSQL on localhost:5432, matches .env.example
pnpm install
cp .env.example .env     # set AUTH_SECRET
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000/register. While the database has no administrator,
the first account you register becomes an approved administrator. Every later
registration waits for an administrator to approve it.

Full setup, including using your own PostgreSQL, is in
[Getting started](docs/getting-started.md).

## Documentation

| Page                                         | Read it when you want to...                                       |
| -------------------------------------------- | ----------------------------------------------------------------- |
| [Getting started](docs/getting-started.md)   | set up a development machine and create the first admin           |
| [Importing data](docs/importing-data.md)     | load an association's legacy export, step by step                 |
| [Configuration](docs/configuration.md)       | look up an environment variable or turn email, Google, captcha on |
| [Privacy policy](docs/privacy-policy.md)     | publish the privacy policy page from the built-in template        |
| [Deployment](docs/deployment.md)             | run the app with Docker, upgrade it, back it up, monitor it       |
| [Architecture](docs/architecture.md)         | understand how a request is handled and where code lives          |
| [Development](docs/development.md)           | change the schema, use the scripts, follow the contribution flow  |
| [Code conventions](docs/code-conventions.md) | know what the linter and reviewers expect                         |
| [Testing](docs/testing.md)                   | run unit, browser and visual tests, and update snapshots          |

The behaviour of the app is specified in [`openspec/`](openspec/), which is
what coding agents work from. The pages above are written for people.
