-- Set or clear the import dates of a HOA
-- Parameters: $1 = date (or NULL), $2 = externalId
UPDATE "HomeownersAssociation"
SET
  "apartmentsDataDate" = $1,
  "chargesDataDate" = $1,
  "notificationsDataDate" = $1
WHERE
  "externalId" = $2
