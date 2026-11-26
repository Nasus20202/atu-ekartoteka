/**
 * One HOA with an apartment and five years of payments whose balances carry
 * over, so the year balance table on the import page is wider than the screen
 * in every database that is seeded with it. The external ID starts with TEST,
 * so the global cleanup removes it.
 */

import type * as pg from 'pg';

import { loadSql } from './load-sql';

export const YEAR_HISTORY_HOA_EXTERNAL_ID = 'TESTYEARS';
export const YEAR_HISTORY_HOA_NAME = 'Wspólnota Wieloletnia';
export const YEAR_HISTORY_YEARS = 5;
const YEAR_HISTORY_BALANCE = 100;

export async function seedYearHistory(client: pg.Client, lastYear: number) {
  const hoa = await client.query(loadSql('insert-scroll-hoa.sql'), [
    YEAR_HISTORY_HOA_EXTERNAL_ID,
    YEAR_HISTORY_HOA_NAME,
  ]);
  const apartment = await client.query(
    loadSql('insert-year-history-apartment.sql'),
    [hoa.rows[0].id]
  );
  const apartmentId: string = apartment.rows[0].id;

  for (let offset = YEAR_HISTORY_YEARS - 1; offset >= 0; offset--) {
    const year = lastYear - offset;
    await client.query(loadSql('insert-year-history-payment.sql'), [
      `${apartmentId}-${year}`,
      apartmentId,
      year,
      new Date(Date.UTC(year, 0, 1)),
      new Date(Date.UTC(year, 11, 31)),
      YEAR_HISTORY_BALANCE,
    ]);
  }
}
