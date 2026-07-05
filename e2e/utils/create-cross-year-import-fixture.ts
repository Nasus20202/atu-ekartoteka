import * as pg from 'pg';

export async function createCrossYearImportFixture(): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) throw new Error('DATABASE_URL is not set');

  const client = new pg.Client({ connectionString: dbUrl });
  try {
    await client.connect();

    const hoaResult = await client.query(
      `INSERT INTO "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), 'TEST04', 'TEST04', NOW(), NOW())
       ON CONFLICT ("externalId") DO UPDATE SET name = 'TEST04'
       RETURNING id`
    );
    const hoaId = hoaResult.rows[0].id as string;

    const apartmentResult = await client.query(
      `INSERT INTO "Apartment" (
         id, "externalOwnerId", "externalApartmentId", owner, email,
         address, building, number, "postalCode", city,
         "shareNumerator", "shareDenominator", "isActive",
         "homeownersAssociationId", "createdAt", "updatedAt"
       )
       VALUES (
         gen_random_uuid(), 'W00001', 'TEST04-TEST04-00000-00001M', 'Test Cross Year', 'test04@test.com',
         'ul. Testowa', '1', '1A', '00-001', 'Warszawa',
         50.5, 1000, true, $1, NOW(), NOW()
       )
       ON CONFLICT ("externalOwnerId", "externalApartmentId") DO UPDATE SET
         owner = 'Test Cross Year',
         email = 'test04@test.com',
         "homeownersAssociationId" = $1,
         "isActive" = true
       RETURNING id`,
      [hoaId]
    );
    const apartmentId = apartmentResult.rows[0].id as string;

    await client.query(
      `INSERT INTO "Payment" (
         id, "apartmentId", year, "dateFrom", "dateTo",
         "openingBalance", "closingBalance",
         "januaryPayments", "februaryPayments", "marchPayments", "aprilPayments",
         "mayPayments", "junePayments", "julyPayments", "augustPayments",
         "septemberPayments", "octoberPayments", "novemberPayments", "decemberPayments",
         "januaryCharges", "februaryCharges", "marchCharges", "aprilCharges",
         "mayCharges", "juneCharges", "julyCharges", "augustCharges",
         "septemberCharges", "octoberCharges", "novemberCharges", "decemberCharges",
         "createdAt", "updatedAt"
       )
       VALUES (
         $1, $2, 2026, '2026-01-01', '2026-12-31',
         0, -444.25,
         0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
         0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
         NOW(), NOW()
       )
       ON CONFLICT ("apartmentId", year) DO UPDATE SET
         "openingBalance" = 0,
         "closingBalance" = -444.25,
         "updatedAt" = NOW()`,
      [`${apartmentId}-2026`, apartmentId]
    );
  } finally {
    await client.end();
  }
}
