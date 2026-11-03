/**
 * Databases used by E2E runs. Both live on the server named by DATABASE_URL:
 * functional specs use `e2e`, visual snapshots use `e2e_visual`.
 */

export const E2E_DATABASE_NAME = 'e2e';
export const VISUAL_DATABASE_NAME = 'e2e_visual';
export const MAINTENANCE_DATABASE_NAME = 'postgres';

export function withDatabaseName(
  connectionString: string,
  databaseName: string
): string {
  const url = new URL(connectionString);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

export function getVisualDatabaseUrl(e2eDatabaseUrl: string): string {
  return withDatabaseName(e2eDatabaseUrl, VISUAL_DATABASE_NAME);
}
