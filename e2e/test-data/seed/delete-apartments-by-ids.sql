-- Delete apartments
-- Parameters: $1 = array of apartment IDs
DELETE FROM "Apartment"
WHERE
  id = ANY ($1::TEXT[])
