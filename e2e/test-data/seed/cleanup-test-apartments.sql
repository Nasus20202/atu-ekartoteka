-- Cleanup test apartments and related records
-- Parameters: $1 = array of apartment IDs

-- Delete charges
DELETE FROM "Charge" WHERE "apartmentId" = ANY($1);

-- Delete charge notifications
DELETE FROM "ChargeNotification" WHERE "apartmentId" = ANY($1);

-- Delete payments
DELETE FROM "Payment" WHERE "apartmentId" = ANY($1);

-- Delete apartments
DELETE FROM "Apartment" WHERE id = ANY($1);
