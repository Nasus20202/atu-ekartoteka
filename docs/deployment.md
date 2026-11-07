# Deployment

How to run the app on a server, upgrade it, and see what it is doing.

The app ships as a Docker image (`ghcr.io/nasus20202/atu-ekartoteka`). It needs
a PostgreSQL database and nothing else. There are two compose files:

| File                       | Use it for                                                                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.prod.yaml` | A real installation. Runs the published image, configurable database credentials.                                                                        |
| `docker-compose.yaml`      | Trying the whole stack locally. Builds the image from source, fixed database credentials (`atu_user` / `atu_password`), database port published on 5432. |

## Install

```bash
cp .env.docker.example .env
```

Edit `.env`. At minimum:

- `POSTGRES_PASSWORD` - a strong password for the database.
- `AUTH_SECRET` - `openssl rand -base64 32`.
- `AUTH_URL` and `APP_URL` - the public URL, for example
  `https://ekartoteka.example.com`.
- `SMTP_*`, `EMAIL_FROM` - so the app can send email. See
  [Configuration](configuration.md).

Then:

```bash
docker compose -f docker-compose.prod.yaml up -d
docker compose -f docker-compose.prod.yaml ps
```

The app listens on `APP_PORT` (default 3000). Put a reverse proxy with HTTPS in
front of it; the app sends HSTS and Content Security Policy headers, so it
is meant to be served over HTTPS. The compose files set `AUTH_TRUST_HOST=true`
so the proxy's forwarded host is accepted.

Register the first account at `/register`: while no administrator exists it
becomes one. Do this right after deploying, before anyone else can.

### What runs

| Service                 | What it does                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------ |
| `db`                    | PostgreSQL 18 with a named volume (`postgres_data`).                                 |
| `ekartoteka-migrations` | Runs `prisma migrate deploy` once and exits. The app starts only after it succeeds.  |
| `ekartoteka`            | The app. Healthy when `/api/health/readiness` answers.                               |
| `otel-lgtm`             | Optional Grafana stack. Start it with `--profile otel`, see [Telemetry](#telemetry). |

Migrations run as a separate job, not at app start, so a failed migration shows
up in `docker compose logs ekartoteka-migrations` instead of looping the app. If
you prefer the app to migrate itself, set `RUN_MIGRATIONS_ON_STARTUP=true`; with
several app containers each will try to migrate, so use it for a single
instance only.

## Upgrade

1. Read [`CHANGELOG.md`](../CHANGELOG.md) for configuration changes.
2. **Back up the database** (see [Backups](#backups)).
3. Pull the new image and restart:

   ```bash
   docker compose -f docker-compose.prod.yaml pull
   docker compose -f docker-compose.prod.yaml up -d
   ```

   The migrations service runs first, then the app starts.

Migrations only go forward. To go back to an earlier version, restore the
backup taken in step 2.

Without Docker, run `pnpm db:deploy` against the production database before
starting the new build.

## Backups

All state is in PostgreSQL. Dump it regularly and before every upgrade:

```bash
docker exec atu-postgres-prod pg_dump -U atu_user atu_ekartoteka > backup.sql
```

(Use the container name and user from your own setup.) Restore into an empty
database with `psql`. A volume snapshot of `postgres_data` also works, with the
database stopped. Test a restore at least once.

## Health checks

| Endpoint                | Answers                                             | Use it for                          |
| ----------------------- | --------------------------------------------------- | ----------------------------------- |
| `/api/health/liveness`  | The process is up. Does not touch the database.     | Restarting a hung container.        |
| `/api/health/readiness` | The database answers. Returns 503 when it does not. | Taking an instance out of rotation. |
| `/api/health`           | Both.                                               | Uptime monitors.                    |

Docker uses the readiness endpoint for the container's health status.

## Scheduled jobs

The app schedules its own jobs; there is no external cron to configure. Both
run every hour and delete expired rows:

- `cleanup-verifications` - expired email verification tokens.
- `cleanup-password-resets` - expired password reset tokens.

Each run is claimed in the database first, so with several app instances a job
still runs once per tick.

## Logs

The app writes JSON logs to stdout. Every line has a `context` such as `auth`,
`import:handler` or `cron:scheduler`, which makes filtering easy. Set
`LOG_LEVEL` to change the amount.

Passwords, tokens and secrets are not logged. Failed sign-ins are logged as
warnings with the reason and the email address, so treat the logs as personal
data. The browser only ever sees a generic message, so the login page does not
reveal which accounts exist.

With `docker compose logs -f ekartoteka` you can follow them live.

## Telemetry

If `OTEL_EXPORTER_ENDPOINT` is set, the app exports traces, metrics and logs
over OTLP/HTTP. `docker compose --profile otel up -d` starts a Grafana stack
(Grafana on port 3001) with the dashboards from `grafana/`. If the endpoint is
unreachable the app keeps working and the data is dropped.

The compose files default `OTEL_EXPORTER_ENDPOINT` to `http://otel-lgtm:4318`,
the service from the `otel` profile. Without that service the export fails
quietly and the app is unaffected; set the variable to your own collector to
send the data elsewhere.

## Email

Without `SMTP_HOST` the app does not send email; it logs the recipient and
subject of each skipped message. Test the SMTP settings by registering an
account and checking that the verification email arrives, and make sure
`EMAIL_FROM` is allowed by your provider.
