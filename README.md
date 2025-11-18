# ATU Ekartoteka

## Prisma migrations (Docker)

You can run Prisma migrations automatically when starting the Docker environment in two ways:

- As a dedicated one-off service in `docker-compose.yml` (default):
  - Start the stack:

    ```bash
    docker-compose up -d db
    docker-compose up --build migrations
    docker-compose up --build app
    ```

  - The `migrations` service runs `pnpm db:deploy` (non-interactive) and exits. It's useful for CI or controlled deployments.

- Inside the `app` container at boot (optional):
  - Set `RUN_MIGRATIONS_ON_STARTUP: "true"` in the `app` service environment to enable running migrations during container startup. This uses an entrypoint script that retries until the DB is reachable and migrations succeed.

  - This approach is handy for single-container workflows or when you want the app to self-migrate before starting.

Notes:

- By default the entrypoint uses `pnpm db:deploy`, which runs `prisma migrate deploy` non-interactively and then calls `prisma generate`.
- If you prefer not to copy developer dependencies (e.g. `prisma` CLI) into the runtime image, use the dedicated `migrations` service instead.
