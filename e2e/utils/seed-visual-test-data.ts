/**
 * Seed the visual regression database (e2e_visual) with fixed data.
 *
 * Tenants have charges for every month of VISUAL_YEAR; visual tests freeze the
 * date at VISUAL_FIXED_NOW, at the end of that year. One tenant has a single
 * apartment, the other has two apartments in one HOA and one in another.
 * Dates of users are pinned so snapshots do not change between runs.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import {
  ADMIN_EMAIL,
  ADMIN_NAME,
  ADMIN_PASSWORD,
  VISUAL_EMAIL,
  VISUAL_FIXED_NOW,
  VISUAL_HOA_EXTERNAL_ID,
  VISUAL_HOA_NAME,
  VISUAL_MULTI_EMAIL,
  VISUAL_MULTI_NAME,
  VISUAL_NAME,
  VISUAL_PASSWORD,
  VISUAL_PENDING_EMAIL,
  VISUAL_PENDING_NAME,
  VISUAL_SECOND_HOA_EXTERNAL_ID,
  VISUAL_SECOND_HOA_NAME,
  VISUAL_UNASSIGNED_EMAIL,
  VISUAL_UNASSIGNED_OWNER,
  VISUAL_YEAR,
} from './test-credentials';

const MONTHS_IN_YEAR = 12;
const BCRYPT_ROUNDS = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;
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

// Data-as-of dates of the .wmb files, shown on the HOA list card
type HoaDataDates = {
  apartments: string;
  charges: string;
  notifications: string;
};

const TESTVIS_DATA_DATES: HoaDataDates = {
  apartments: '2024-12-02T00:00:00Z',
  charges: '2024-12-05T00:00:00Z',
  notifications: '2024-12-10T00:00:00Z',
};

async function upsertHoa(
  client: pg.Client,
  externalId: string,
  name: string,
  header: string,
  dataDates: HoaDataDates | null = null
): Promise<string> {
  const hoa = await client.query(loadSql('upsert-visual-hoa.sql'), [
    externalId,
    name,
    header,
    dataDates?.apartments ?? null,
    dataDates?.charges ?? null,
    dataDates?.notifications ?? null,
  ]);
  return hoa.rows[0].id;
}

async function upsertApartment(
  client: pg.Client,
  ownerName: string,
  ownerEmail: string,
  userId: string | null,
  apartment: VisualApartment
): Promise<string> {
  const result = await client.query(loadSql('upsert-visual-apartment.sql'), [
    ownerName,
    ownerEmail,
    apartment.hoaId,
    userId,
    apartment.externalOwnerId,
    apartment.externalApartmentId,
    apartment.address,
    apartment.building,
    apartment.number,
  ]);
  return result.rows[0].id;
}

async function seedCharges(client: pg.Client, apartmentId: string) {
  for (let month = 1; month <= MONTHS_IN_YEAR; month++) {
    await client.query(loadSql('insert-charges.sql'), [
      apartmentId,
      new Date(VISUAL_YEAR, month - 1, 1),
      new Date(VISUAL_YEAR, month, 0),
      `${VISUAL_YEAR}${String(month).padStart(2, '0')}`,
    ]);
  }
  await client.query(loadSql('insert-charge-notifications.sql'), [apartmentId]);
  await client.query(loadSql('insert-payment.sql'), [
    `${apartmentId}-${VISUAL_YEAR}`,
    apartmentId,
    VISUAL_YEAR,
    new Date(VISUAL_YEAR, 0, 1),
    new Date(VISUAL_YEAR, 11, 31),
  ]);
}

async function seedTenant(
  client: pg.Client,
  email: string,
  name: string,
  apartments: VisualApartment[]
) {
  const passwordHash = await bcrypt.hash(VISUAL_PASSWORD, BCRYPT_ROUNDS);
  const user = await client.query(loadSql('upsert-regular-user.sql'), [
    email,
    passwordHash,
    name,
  ]);
  for (const apartment of apartments) {
    const apartmentId = await upsertApartment(
      client,
      name,
      email,
      user.rows[0].id,
      apartment
    );
    await seedCharges(client, apartmentId);
  }
}

async function seedAdmin(client: pg.Client) {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);
  await client.query(loadSql('upsert-admin-user.sql'), [
    ADMIN_EMAIL,
    passwordHash,
    ADMIN_NAME,
  ]);
}

async function seedPendingUser(client: pg.Client) {
  const passwordHash = await bcrypt.hash(VISUAL_PASSWORD, BCRYPT_ROUNDS);
  await client.query(loadSql('upsert-pending-user.sql'), [
    VISUAL_PENDING_EMAIL,
    passwordHash,
    VISUAL_PENDING_NAME,
  ]);
}

// Equal creation dates tie in the users list, so each user gets its own day
const PINNED_USER_EMAILS = [
  ADMIN_EMAIL,
  VISUAL_EMAIL,
  VISUAL_MULTI_EMAIL,
  VISUAL_PENDING_EMAIL,
];

async function pinCreationDates(client: pg.Client) {
  const fixedNow = Date.parse(VISUAL_FIXED_NOW);
  const dates = PINNED_USER_EMAILS.map((_, index) =>
    new Date(
      fixedNow - (PINNED_USER_EMAILS.length - index) * MS_PER_DAY
    ).toISOString()
  );
  await client.query(loadSql('pin-user-created-at.sql'), [
    PINNED_USER_EMAILS,
    dates,
  ]);
}

async function seedRecords(client: pg.Client) {
  const hoaId = await upsertHoa(
    client,
    VISUAL_HOA_EXTERNAL_ID,
    VISUAL_HOA_NAME,
    HOA_HEADER,
    TESTVIS_DATA_DATES
  );
  const secondHoaId = await upsertHoa(
    client,
    VISUAL_SECOND_HOA_EXTERNAL_ID,
    VISUAL_SECOND_HOA_NAME,
    SECOND_HOA_HEADER
  );

  await seedAdmin(client);
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
  await seedPendingUser(client);
  await upsertApartment(
    client,
    VISUAL_UNASSIGNED_OWNER,
    VISUAL_UNASSIGNED_EMAIL,
    null,
    {
      hoaId,
      externalOwnerId: 'WVIS05',
      externalApartmentId: 'TESTVIS-TESTVIS-00000-00004M',
      address: 'ul. Testowa',
      building: '4',
      number: '1',
    }
  );

  await pinCreationDates(client);
}

export async function seedVisualTestData(connectionString: string) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await seedRecords(client);
  } finally {
    await client.end();
  }
}
