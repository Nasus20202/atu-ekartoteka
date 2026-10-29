-- Parameters: $1 = first apartment, $2 = last apartment, $3 = months of history, $4 = charge lines per month
-- The history ends at the current month
INSERT INTO "Charge" (
  id, "externalLineNo", "apartmentId", "dateFrom", "dateTo", period, description,
  quantity, unit, "unitPrice", "totalAmount", "createdAt", "updatedAt"
)
SELECT
  'perf-chg-' || n || '-' || m || '-' || l, l, 'perf-apt-' || n,
  month_start, (month_start + interval '1 month - 1 day')::date,
  to_char(month_start, 'YYYYMM'), 'Naliczenie pozycja ' || l,
  1, 'szt.', 10 + l, 10 + l, NOW(), NOW()
FROM generate_series($1::int, $2::int) AS n,
  generate_series(0, $3::int - 1) AS m,
  generate_series(1, $4::int) AS l,
  LATERAL (SELECT (date_trunc('month', NOW()) - make_interval(months => m))::date AS month_start) AS ms
ON CONFLICT ("apartmentId", period, "externalLineNo") DO NOTHING
