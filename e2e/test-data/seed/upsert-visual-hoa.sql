-- Upsert HOA for visual regression tests
-- Parameters: $1 = externalId, $2 = name, $3 = header,
-- $4 = apartments data date, $5 = charges data date, $6 = notifications data date (null when unknown)
INSERT INTO "HomeownersAssociation" (id, "externalId", name, header, "apartmentsDataDate", "chargesDataDate", "notificationsDataDate", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), $1, $2, $3, $4::timestamptz, $5::timestamptz, $6::timestamptz, NOW(), NOW())
ON CONFLICT ("externalId") DO UPDATE SET name = $2, header = $3, "apartmentsDataDate" = $4::timestamptz, "chargesDataDate" = $5::timestamptz, "notificationsDataDate" = $6::timestamptz
RETURNING id
