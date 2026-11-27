/** Replaces the settlements of an apartment with the sample ones. */

import type * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';
import { annualSample, utilitySample } from './settlement-samples';

export interface SeededSettlements {
  utilityIds: string[];
  annualIds: string[];
}

export async function seedSettlements(
  client: pg.Client,
  apartmentId: string,
  years: { utility: number[]; annual: number[] }
): Promise<SeededSettlements> {
  await deleteSettlements(client, [apartmentId]);
  const seeded: SeededSettlements = { utilityIds: [], annualIds: [] };

  for (const year of years.utility) {
    const { header, summaries, lines, readings } = utilitySample(year);
    const result = await client.query(
      loadSql('insert-utility-settlement.sql'),
      [
        apartmentId,
        ...[header, summaries, lines, readings].map((rows) =>
          JSON.stringify(rows)
        ),
      ]
    );
    seeded.utilityIds.push(result.rows[0].id);
  }

  for (const year of years.annual) {
    const { header, items } = annualSample(year);
    const result = await client.query(loadSql('insert-annual-settlement.sql'), [
      apartmentId,
      JSON.stringify(header),
      JSON.stringify(items),
    ]);
    seeded.annualIds.push(result.rows[0].id);
  }

  return seeded;
}
