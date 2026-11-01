-- Set the notification header and footer of a HOA for E2E tests
-- Parameters: $1 = externalId, $2 = header (nullable), $3 = footer (nullable)
UPDATE "HomeownersAssociation"
SET header = $2, footer = $3
WHERE "externalId" = $1
