/**
 * A temporary association for one import spec, with the apartments and charges
 * that its generated printouts are matched with and checked against.
 */

import * as pg from 'pg';

import { deleteSettlements } from './delete-settlements';
import { loadSql } from './load-sql';

export interface ImportHoa {
  hoaId: string;
  /** Also its name */
  externalId: string;
  /** Apartment records added so far */
  records: number;
}

export interface ImportApartment {
  id: string;
  externalApartmentId: string;
  /** Unique across associations, so annual printouts match by address */
  number: string;
  meterSerial: string;
  owner: string;
}

export interface ChargeSeed {
  /** YYYYMM */
  period: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ApartmentOptions {
  /** The apartment whose former or current owner this record is */
  sameApartmentAs?: ImportApartment;
  isActive?: boolean;
}

async function withClient<T>(work: (client: pg.Client) => Promise<T>) {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

export function createImportHoa(): Promise<ImportHoa> {
  // Unique, because every worker and retry seeds its own association. Short,
  // because the apartment id has to fit on one printed line
  const random = Math.floor(Math.random() * 1000);
  const externalId = `TESTI${Date.now().toString(36)}${random}`.toUpperCase();
  return withClient(async (client) => {
    const hoa = await client.query(loadSql('upsert-test-hoa.sql'), [
      externalId,
    ]);
    return { hoaId: hoa.rows[0].id as string, externalId, records: 0 };
  });
}

export function addImportApartment(
  hoa: ImportHoa,
  owner: string,
  { sameApartmentAs, isActive = true }: ApartmentOptions = {}
): Promise<ImportApartment> {
  const record = ++hoa.records;
  const apartment = sameApartmentAs ?? {
    externalApartmentId: `${hoa.externalId}-00000-${String(record).padStart(5, '0')}M`,
    number: `${hoa.externalId}N${record}`,
    meterSerial: `${hoa.externalId.slice(5)}${record}`,
  };

  return withClient(async (client) => {
    const result = await client.query(
      loadSql('insert-unassigned-apartment.sql'),
      [
        `W${String(record).padStart(5, '0')}`,
        apartment.externalApartmentId,
        owner,
        '',
        apartment.number,
        isActive,
        hoa.hoaId,
      ]
    );
    return { ...apartment, id: result.rows[0].id as string, owner };
  });
}

export function addCharges(
  { id }: ImportApartment,
  charges: ChargeSeed[]
): Promise<void> {
  return withClient(async (client) => {
    const insert = loadSql('insert-settlement-charge.sql');
    for (const [index, charge] of charges.entries()) {
      await client.query(insert, [
        id,
        charge.period,
        index + 1,
        charge.description,
        charge.quantity,
        charge.unitPrice,
        charge.amount,
      ]);
    }
  });
}

export function deleteImportHoa({ hoaId }: ImportHoa): Promise<void> {
  return withClient(async (client) => {
    const apartments = await client.query(
      loadSql('select-test-apartments.sql'),
      [[hoaId]]
    );
    const ids = apartments.rows.map((row) => row.id as string);
    await deleteSettlements(client, ids);
    await client.query(loadSql('delete-charges-by-apartments.sql'), [ids]);
    await client.query(loadSql('cleanup-hoa-apartments.sql'), [hoaId]);
    await client.query(loadSql('cleanup-hoa.sql'), [hoaId]);
  });
}
