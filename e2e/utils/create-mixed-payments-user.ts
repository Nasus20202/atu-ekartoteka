/**
 * Seed an approved tenant with a single apartment and a payment year that mixes
 * zero and non-zero months (charge records in January, May and July). Used to
 * verify empty-month filtering in E2E; yearsAgo adds the same payment year
 * (and its charge records) that many years before the current one.
 */

import bcrypt from 'bcrypt';
import * as pg from 'pg';

import { loadSql } from './load-sql';
import { USER_PASSWORD } from './test-credentials';

// The imported monthly charges and closing balance in the payment record are
// deliberately wrong; the charge records below are what the app must present
// January has a zero line so the year always has a charge record to list
const MIXED_CHARGES = [
  { monthIndex: 0, lineNo: 1, amount: 0 },
  { monthIndex: 4, lineNo: 2, amount: 100 },
  { monthIndex: 6, lineNo: 3, amount: 149.875 },
];

export async function createMixedPaymentsUser({
  yearsAgo = [],
}: { yearsAgo?: number[] } = {}): Promise<{
  email: string;
  year: number;
  apartmentId: string;
  hoaId: string;
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });

  try {
    await client.connect();

    const hoaResult = await client.query(
      loadSql('select-hoa-id-by-external-id.sql'),
      ['TEST01']
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `payments-e2e-${uniqueSuffix}@e2e-test.com`;
    const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);
    const year = new Date().getFullYear();

    const userResult = await client.query(loadSql('insert-tenant-user.sql'), [
      email,
      passwordHash,
      'E2E Mixed Payments User',
    ]);
    const userId = userResult.rows[0].id as string;

    const apartmentResult = await client.query(
      loadSql('insert-mixed-apartment.sql'),
      [
        `WMP-${uniqueSuffix}`,
        `TEST01-MIXED-${uniqueSuffix}`,
        email,
        hoaId,
        userId,
      ]
    );
    const apartmentId = apartmentResult.rows[0].id as string;

    const years = [year, ...yearsAgo.map((offset) => year - offset)];

    for (const paymentYear of years) {
      await client.query(loadSql('insert-mixed-payment.sql'), [
        `${apartmentId}-${paymentYear}`,
        apartmentId,
        paymentYear,
        new Date(paymentYear, 0, 1),
        new Date(paymentYear, 11, 31),
      ]);
      for (const charge of MIXED_CHARGES) {
        await client.query(loadSql('insert-charge-line.sql'), [
          apartmentId,
          new Date(paymentYear, charge.monthIndex, 1),
          new Date(paymentYear, charge.monthIndex + 1, 0),
          `${paymentYear}${String(charge.monthIndex + 1).padStart(2, '0')}`,
          charge.lineNo,
          charge.amount,
        ]);
      }
    }

    return { email, year, apartmentId, hoaId };
  } finally {
    await client.end();
  }
}
