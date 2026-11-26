-- Delete charges of apartments
-- Parameters: $1 = array of apartment IDs
DELETE FROM "Charge"
WHERE
  "apartmentId" = ANY ($1::TEXT[])
