-- Delete payments of apartments
-- Parameters: $1 = array of apartment IDs
DELETE FROM "Payment"
WHERE
  "apartmentId" = ANY ($1::TEXT[])
