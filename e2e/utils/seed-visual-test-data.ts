/**
 * Seed tenants for visual snapshots with charges for every month of
 * VISUAL_YEAR; visual tests freeze the date at VISUAL_FIXED_NOW, at the end
 * of that year. One tenant has a single apartment, the other has two
 * apartments in one HOA and one in another.
 */

import bcrypt from 'bcrypt';
import type * as pg from 'pg';

import { loadSql } from './load-sql';
import {
  VISUAL_EMAIL,
  VISUAL_HOA_EXTERNAL_ID,
  VISUAL_HOA_NAME,
  VISUAL_MULTI_EMAIL,
  VISUAL_MULTI_NAME,
  VISUAL_NAME,
  VISUAL_PASSWORD,
  VISUAL_SECOND_HOA_EXTERNAL_ID,
  VISUAL_SECOND_HOA_NAME,
  VISUAL_YEAR,
} from './test-credentials';

const MONTHS_IN_YEAR = 12;
const HOA_HEADER = [
  'TESTOWE ZAWIADOMIENIE O WYSOKOŚCI COMIESIĘCZNYCH OPŁAT.',
  'Treść nagłówka wspólnoty używana w testach E2E.',
  'Konto testowe: 00 0000 0000 0000 0000 0000 0000',
].join('\n');
const SECOND_HOA_HEADER =
  'TESTOWE ZAWIADOMIENIE DRUGIEJ WSPÓLNOTY.\nKonto testowe: 11 1111 1111 1111 1111 1111 1111';

type VisualApartment = {
  hoaId: string;
  externalOwnerId: string;
  externalApartmentId: string;
  address: string;
  building: string;
  number: string;
};

async function upsertHoa(
  client: pg.Client,
  externalId: string,
  name: string,
  header: string
): Promise<string> {
  const hoa = await client.query(loadSql('upsert-visual-hoa.sql'), [
    externalId,
    name,
    header,
  ]);
  return hoa.rows[0].id;
}

async function seedTenant(
  client: pg.Client,
  email: string,
  name: string,
  apartments: VisualApartment[]
) {
  const passwordHash = await bcrypt.hash(VISUAL_PASSWORD, 10);
  const user = await client.query(loadSql('upsert-regular-user.sql'), [
    email,
    passwordHash,
    name,
  ]);

  for (const apartment of apartments) {
    const result = await client.query(loadSql('upsert-visual-apartment.sql'), [
      name,
      email,
      apartment.hoaId,
      user.rows[0].id,
      apartment.externalOwnerId,
      apartment.externalApartmentId,
      apartment.address,
      apartment.building,
      apartment.number,
    ]);
    const apartmentId = result.rows[0].id;

    for (let month = 1; month <= MONTHS_IN_YEAR; month++) {
      await client.query(loadSql('insert-charges.sql'), [
        apartmentId,
        new Date(VISUAL_YEAR, month - 1, 1),
        new Date(VISUAL_YEAR, month, 0),
        `${VISUAL_YEAR}${String(month).padStart(2, '0')}`,
      ]);
    }
    await client.query(loadSql('insert-charge-notifications.sql'), [
      apartmentId,
    ]);
    await client.query(loadSql('insert-payment.sql'), [
      `${apartmentId}-${VISUAL_YEAR}`,
      apartmentId,
      VISUAL_YEAR,
      new Date(VISUAL_YEAR, 0, 1),
      new Date(VISUAL_YEAR, 11, 31),
    ]);
  }
}

export async function seedVisualTestData(client: pg.Client) {
  const hoaId = await upsertHoa(
    client,
    VISUAL_HOA_EXTERNAL_ID,
    VISUAL_HOA_NAME,
    HOA_HEADER
  );
  const secondHoaId = await upsertHoa(
    client,
    VISUAL_SECOND_HOA_EXTERNAL_ID,
    VISUAL_SECOND_HOA_NAME,
    SECOND_HOA_HEADER
  );

  await seedTenant(client, VISUAL_EMAIL, VISUAL_NAME, [
    {
      hoaId,
      externalOwnerId: 'WVIS01',
      externalApartmentId: 'TESTVIS-TESTVIS-00000-00001M',
      address: 'ul. Testowa z Bardzo Długą Nazwą Ulicy E2E',
      building: '11',
      number: '1',
    },
  ]);
  await seedTenant(client, VISUAL_MULTI_EMAIL, VISUAL_MULTI_NAME, [
    {
      hoaId,
      externalOwnerId: 'WVIS02',
      externalApartmentId: 'TESTVIS-TESTVIS-00000-00002M',
      address: 'ul. Testowa',
      building: '2',
      number: '5',
    },
    {
      hoaId,
      externalOwnerId: 'WVIS04',
      externalApartmentId: 'TESTVIS-TESTVIS-00000-00003M',
      address: 'ul. Testowa',
      building: '2',
      number: '6',
    },
    {
      hoaId: secondHoaId,
      externalOwnerId: 'WVIS03',
      externalApartmentId: 'TESTVIS2-TESTVIS2-00000-00001M',
      address: 'ul. Krótka',
      building: '3',
      number: '7',
    },
  ]);
}
