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
      `SELECT id FROM "HomeownersAssociation" WHERE "externalId" = 'TEST01'`
    );
    const hoaId = hoaResult.rows[0]?.id;

    if (!hoaId) {
      throw new Error('Test HOA (TEST01) not found — run global seed first');
    }

    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const email = `payments-e2e-${uniqueSuffix}@e2e-test.com`;
    const passwordHash = await bcrypt.hash(USER_PASSWORD, 10);
    const year = new Date().getFullYear();

    const userResult = await client.query(
      `INSERT INTO "User" (
         id, email, name, password, role, status,
         "emailVerified", "mustChangePassword", "authMethod",
         "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, 'E2E Mixed Payments User', $2,
         'TENANT', 'APPROVED', true, false, 'CREDENTIALS',
         NOW(), NOW()
       )
       RETURNING id`,
      [email, passwordHash]
    );
    const userId = userResult.rows[0].id as string;

    const apartmentResult = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "userId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), $1, $2, 'E2E Mixed Payments User', $3,
         'ul. Mieszana', '9', '9A', '00-001', 'Warszawa',
         12.5, 100, true, $4, $5, NOW(), NOW()
       )
       RETURNING id`,
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
      await client.query(
        `INSERT INTO "Payment" (
         id, "apartmentId", year, "dateFrom", "dateTo",
         "openingBalance", "closingBalance", "openingDebt", "openingSurplus",
         "januaryPayments", "februaryPayments", "marchPayments", "aprilPayments",
         "mayPayments", "junePayments", "julyPayments", "augustPayments",
         "septemberPayments", "octoberPayments", "novemberPayments", "decemberPayments",
         "januaryCharges", "februaryCharges", "marchCharges", "aprilCharges",
         "mayCharges", "juneCharges", "julyCharges", "augustCharges",
         "septemberCharges", "octoberCharges", "novemberCharges", "decemberCharges",
         "createdAt", "updatedAt"
       )
        VALUES (
          $1, $2, $3, $4, $5,
          0, -124.9375, 0, 0,
          100.0000, 0, 24.9375, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,
          100.0000, 0, 149.8750, 0,
          0, 0, 0, 0,
          NOW(), NOW()
        )`,
        [
          `${apartmentId}-${paymentYear}`,
          apartmentId,
          paymentYear,
          new Date(paymentYear, 0, 1),
          new Date(paymentYear, 11, 31),
        ]
      );
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
