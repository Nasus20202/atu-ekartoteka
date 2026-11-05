# Configuration

The app is configured with environment variables. Locally they come from
`.env` (start from `.env.example`). With Docker, copy `.env.docker.example` to
`.env`; the compose files pass it to the containers. Secrets stay server-side:
never put one in a `NEXT_PUBLIC_*` variable, which would be sent to browsers.

Changing a variable needs a restart.

## The minimum

| Variable       | What it is                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string, e.g. `postgresql://user:pass@host:5432/atu_ekartoteka?schema=public`.            |
| `AUTH_SECRET`  | Signs session cookies and tokens. Long and random (`openssl rand -base64 32`). Changing it signs everyone out. |
| `AUTH_URL`     | The public URL people open, e.g. `https://ekartoteka.example.com`.                                             |

`NEXTAUTH_SECRET` and `NEXTAUTH_URL` are accepted as older names for the last
two.

Behind a reverse proxy, also set `AUTH_TRUST_HOST=true` so the forwarded host is
accepted. The compose files already set it.

## What turns on when

Each optional feature is enabled by its variables being set. Without them the
feature is off and the app still works.

| Feature        | Enabled by                                          | When it is off                                                         |
| -------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| Email          | `SMTP_HOST`                                         | Nothing is sent. Each skipped email is logged (recipient and subject). |
| Captcha        | `TURNSTILE_SITE_KEY` **and** `TURNSTILE_SECRET_KEY` | No captcha widget, no check on register, login, password reset.        |
| Google sign-in | `GOOGLE_CLIENT_ID` **and** `GOOGLE_CLIENT_SECRET`   | The Google button is hidden.                                           |
| Telemetry      | `OTEL_EXPORTER_ENDPOINT`                            | Nothing is exported.                                                   |
| Analytics      | `TRACKING_SCRIPT`                                   | No script is served.                                                   |
| Read replicas  | `DATABASE_REPLICA_URLS`                             | All queries go to `DATABASE_URL`.                                      |

Email matters for production. Registration, email verification, password
reset, account approval and the invitation of owners all send mail. Without
SMTP, a user who forgets a password has no way to reset it.

## Database

| Variable                              | Default | Notes                                                                                       |
| ------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                        | -       | Used for all writes, and for reads when there are no replicas.                              |
| `DATABASE_REPLICA_URLS`               | empty   | Comma-separated connection strings. Reads go to the replicas, writes to `DATABASE_URL`.     |
| `DATABASE_POOL_MAX`                   | `10`    | Connections per client: the primary and each replica each get their own pool.               |
| `DATABASE_POOL_CONNECTION_TIMEOUT_MS` | `5000`  | How long a query waits for a free connection before failing.                                |
| `RUN_MIGRATIONS_ON_STARTUP`           | `false` | Docker image only. When `true`, the container runs `prisma migrate deploy` before starting. |

For the PostgreSQL container in `docker-compose.prod.yaml`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB` and `POSTGRES_PORT` set the database up on
first start.

## Email

| Variable                 | Default               | Notes                                                                                                                        |
| ------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `SMTP_HOST`              | unset                 | Turns sending on.                                                                                                            |
| `SMTP_PORT`              | `465`                 | The compose files default to `587`.                                                                                          |
| `SMTP_SECURE`            | `true`                | Anything except `false` means implicit TLS (port 465). Set `false` for STARTTLS (587). The compose files default to `false`. |
| `SMTP_USER`, `SMTP_PASS` | unset                 | Credentials.                                                                                                                 |
| `EMAIL_FROM`             | `noreply@example.com` | Must be an address your SMTP provider lets you send from.                                                                    |
| `EMAIL_FROM_NAME`        | unset                 | Display name of the sender.                                                                                                  |
| `APP_URL`                | unset                 | Base of the links inside emails. Set it to the same value as `AUTH_URL`.                                                     |

In production the SMTP server's TLS certificate must be valid. In development
invalid certificates are accepted.

## Captcha and Google

**Turnstile** - create a widget in the Cloudflare dashboard and set both keys.
When both are set, a missing or invalid token is refused, and so is a request
for which Cloudflare cannot be reached. Setting only one key leaves the captcha
off.

**Google** - in Google Cloud Console, create OAuth credentials, add
`<AUTH_URL>/api/auth/callback/google` as a redirect URI, and set the client ID
and secret.

`TURNSTILE_VERIFY_URL` and `GOOGLE_ISSUER_URL` redirect these services to a
local mock. They exist for the test suites and should not be set in production.

## Analytics

`TRACKING_SCRIPT` is JavaScript that runs on every page, served from
`/api/tracking`. `TRACKING_ORIGINS` is a space-separated list of origins the
script may load from or send data to; the Content Security Policy blocks
anything not listed. See `.env.example` for Plausible and Umami snippets.

Only add a script you trust.

## Logging and telemetry

| Variable                   | Default                                  | Notes                                                                          |
| -------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------ |
| `LOG_LEVEL`                | `debug` in development, `info` otherwise | `debug`, `info`, `warn`, `error`.                                              |
| `ENABLE_TEST_LOGS`         | `false`                                  | Test runs are silent unless this is `true`.                                    |
| `OTEL_EXPORTER_ENDPOINT`   | unset                                    | OTLP/HTTP endpoint for traces, metrics and logs, e.g. `http://localhost:4318`. |
| `OTEL_SERVICE_NAME`        | `atu-ekartoteka`                         | Service name in the telemetry backend.                                         |
| `OTEL_RESOURCE_ATTRIBUTES` | unset                                    | Extra resource attributes, standard OpenTelemetry format.                      |

## Docker only

| Variable    | Where used                 | Notes                                                    |
| ----------- | -------------------------- | -------------------------------------------------------- |
| `APP_PORT`  | `docker-compose.prod.yaml` | Host port for the app (default `3000`).                  |
| `APP_IMAGE` | `docker-compose.prod.yaml` | Image to run. Defaults to the published image.           |
| `NODE_ENV`  | all                        | Set to `production` by the compose files and Dockerfile. |
