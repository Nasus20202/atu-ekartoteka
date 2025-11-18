#!/bin/sh
set -e

# Default to not running migrations automatically on container startup; toggle with
# RUN_MIGRATIONS_ON_STARTUP=true at runtime or in compose if needed.
if [ "${RUN_MIGRATIONS_ON_STARTUP:-false}" = "true" ]; then
  echo "RUN_MIGRATIONS_ON_STARTUP is enabled; applying Prisma migrations..."

  max_retries=30
  i=0
  until [ $i -ge $max_retries ]
  do
    if pnpm db:deploy; then
      echo "Migrations applied successfully."
      break
    fi
    i=$((i+1))
    echo "Migration attempt $i/$max_retries failed; waiting for DB to become available..."
    sleep 2
  done

  if [ $i -ge $max_retries ]; then
    echo "Migrations failed after $max_retries attempts" >&2
    exit 1
  fi
else
  echo "RUN_MIGRATIONS_ON_STARTUP is not set to true; skipping migrations."
fi

# Execute the CMD
exec "$@"
