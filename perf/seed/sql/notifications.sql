-- Parameters: $1 = apartment count, $2 = notification lines per apartment
INSERT INTO "ChargeNotification" (
  id, "lineNo", "apartmentId", description, quantity, unit, "unitPrice", "totalAmount",
  "createdAt", "updatedAt"
)
SELECT 'perf-ntf-' || n || '-' || l, l, 'perf-apt-' || n, 'Zawiadomienie pozycja ' || l,
  1, 'szt.', 10 + l, 10 + l, NOW(), NOW()
FROM generate_series(1, $1::int) AS n, generate_series(1, $2::int) AS l
ON CONFLICT ("apartmentId", "lineNo") DO NOTHING
