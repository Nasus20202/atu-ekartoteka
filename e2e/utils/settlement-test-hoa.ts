/**
 * A temporary HOA with one apartment and the charges that the generated sample
 * settlement is checked against.
 */

import * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';

export const SETTLEMENT_OWNER = 'Rozliczenie Testowe';

const MONTHS = ['202205', '202206', '202207', '202208', '202209'];

function connect() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  return new pg.Client({ connectionString: dbUrl });
}

export interface SettlementTestHoa {
  hoaId: string;
  apartmentId: string;
  externalApartmentId: string;
}

export async function createSettlementTestHoa(
  externalId: string
): Promise<SettlementTestHoa> {
  const client = connect();
  const externalApartmentId = `${externalId}-${externalId}-00000-00001M`;
  try {
    await client.connect();
    const hoa = await client.query(loadSql('upsert-test-hoa.sql'), [
      externalId,
    ]);
    const hoaId = hoa.rows[0].id as string;
    const apartment = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      ['W00001', externalApartmentId, SETTLEMENT_OWNER, '', '1', true, hoaId]
    );
    const apartmentId = apartment.rows[0].id as string;
    const insert = loadSql('insert-settlement-charge.sql');

    for (const month of MONTHS) {
      await client.query(insert, [
        apartmentId,
        month,
        1,
        'Zaliczka CW',
        3,
        32,
        96,
      ]);
    }
    await client.query(insert, [
      apartmentId,
      MONTHS[MONTHS.length - 1],
      2,
      'Wyrównanie zaliczek CW',
      -4.7,
      32,
      -150.4,
    ]);

    return { hoaId, apartmentId, externalApartmentId };
  } finally {
    await client.end();
  }
}

export async function deleteSettlementTestHoa({
  hoaId,
  apartmentId,
}: SettlementTestHoa): Promise<void> {
  const client = connect();
  try {
    await client.connect();
    await deleteSettlements(client, [apartmentId]);
    await client.query(loadSql('delete-charges-by-apartments.sql'), [
      [apartmentId],
    ]);
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [hoaId]);
    await client.query(loadSql('cleanup-hoa.sql'), [hoaId]);
  } finally {
    await client.end();
  }
}
