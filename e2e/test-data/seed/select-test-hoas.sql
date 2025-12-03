-- Select test HOAs by external ID pattern
SELECT id FROM "HomeownersAssociation" WHERE "externalId" IN ('TEST01', 'TEST02')
