-- Check whether a database exists on the server
-- Parameters: $1 = database name
SELECT 1 FROM pg_database WHERE datname = $1
