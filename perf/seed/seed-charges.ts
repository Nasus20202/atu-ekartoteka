import * as pg from 'pg';

const CHARGE_WORKERS = 4;

interface ChargeVolume {
  apartments: number;
  months: number;
  linesPerMonth: number;
}

/** Splits 1..total into at most `parts` contiguous, inclusive ranges. */
export function splitRange(total: number, parts: number): [number, number][] {
  const size = Math.ceil(total / parts);
  return Array.from({ length: Math.min(parts, total) }, (_, index) => [
    index * size + 1,
    Math.min(total, (index + 1) * size),
  ]);
}

async function insertRange(
  connectionString: string,
  sql: string,
  [first, last]: [number, number],
  { months, linesPerMonth }: ChargeVolume
) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query(sql, [
      first,
      last,
      months,
      linesPerMonth,
    ]);
    return result.rowCount ?? 0;
  } finally {
    await client.end();
  }
}

/** Loads the charges over parallel connections and returns the inserted rows. */
export async function seedCharges(
  connectionString: string,
  sql: string,
  volume: ChargeVolume
) {
  const inserted = await Promise.all(
    splitRange(volume.apartments, CHARGE_WORKERS).map((range) =>
      insertRange(connectionString, sql, range, volume)
    )
  );
  return inserted.reduce((total, rows) => total + rows, 0);
}
