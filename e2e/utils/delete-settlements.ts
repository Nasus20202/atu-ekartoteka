/** Settlements refer to apartments, so they are deleted before them. */

import type * as pg from 'pg';

import { loadSql } from './load-sql';

export async function deleteSettlements(
  client: pg.Client,
  apartmentIds: string[]
): Promise<void> {
  await client.query(loadSql('delete-utility-settlements-by-apartments.sql'), [
    apartmentIds,
  ]);
  await client.query(loadSql('delete-annual-settlements-by-apartments.sql'), [
    apartmentIds,
  ]);
}
