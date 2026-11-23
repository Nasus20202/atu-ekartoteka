// Owner rows start with W; others (e.g. N for leases) are not apartments
const OWNER_ID_PREFIX = 'W';

export function isOwnerId(id: string): boolean {
  return id.trim().startsWith(OWNER_ID_PREFIX);
}
