-- Parameters: $1 = HOA count
INSERT INTO "HomeownersAssociation" (id, "externalId", name, "createdAt", "updatedAt")
SELECT 'perf-hoa-' || h, 'PERF' || lpad(h::text, 4, '0'), 'Wspólnota perf ' || h, NOW(), NOW()
FROM generate_series(1, $1::int) AS h
ON CONFLICT ("externalId") DO NOTHING
