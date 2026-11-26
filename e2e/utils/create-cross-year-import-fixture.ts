import * as pg from 'pg';

import { loadSql } from './load-sql';

export const FULL_YEAR_2026_END = '2026-12-31';

export async function createCrossYearImportFixture(
  dateTo: string = FULL_YEAR_2026_END
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const hoaResult = await client.query(loadSql('upsert-test-hoa.sql'), [
      'TEST04',
    ]);
    const hoaId = hoaResult.rows[0].id as string;

    const apartmentResult = await client.query(
      loadSql('insert-cross-year-apartment.sql'),
      [hoaId]
    );
    const apartmentId = apartmentResult.rows[0].id as string;

    await client.query(loadSql('upsert-cross-year-payment.sql'), [
      `${apartmentId}-2026`,
      apartmentId,
      dateTo,
    ]);
  } finally {
    await client.end();
  }
}
