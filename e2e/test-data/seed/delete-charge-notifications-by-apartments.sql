-- Delete charge notifications of apartments
-- Parameters: $1 = array of apartment IDs
DELETE FROM "ChargeNotification"
WHERE
  "apartmentId" = ANY ($1::TEXT[])
