-- Insert one charge line that a settlement is checked against
-- Parameters: $1 = apartmentId, $2 = period (YYYYMM), $3 = line number,
--             $4 = description, $5 = quantity, $6 = unit price, $7 = amount
INSERT INTO
  "Charge" (
    id,
    "externalLineNo",
    "apartmentId",
    "dateFrom",
    "dateTo",
    period,
    description,
    quantity,
    unit,
    "unitPrice",
    "totalAmount",
    "createdAt",
    "updatedAt"
  )
VALUES
  (
    gen_random_uuid(),
    $3,
    $1,
    to_date($2, 'YYYYMM'),
    to_date($2, 'YYYYMM') + INTERVAL '1 month - 1 day',
    $2,
    $4,
    $5,
    'm3',
    $6,
    $7,
    NOW(),
    NOW()
  )
ON CONFLICT ("apartmentId", period, "externalLineNo") DO NOTHING
