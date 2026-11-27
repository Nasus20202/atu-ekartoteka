-- Delete annual cost settlements of apartments; their items go with them
-- Parameters: $1 = array of apartment IDs
DELETE FROM "AnnualCostSettlement"
WHERE
  "apartmentId" = ANY ($1::TEXT[])
