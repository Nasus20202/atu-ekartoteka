-- Parameters: $1 = apartment count, $2 = months of history, $3 = charge lines per month
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
FROM generate_series(1, $1::int) AS n,
  generate_series(0, $2::int - 1) AS m,
  generate_series(1, $3::int) AS l,
  LATERAL (SELECT (date_trunc('month', NOW()) - make_interval(months => m))::date AS month_start) AS ms
ON CONFLICT ("apartmentId", period, "externalLineNo") DO NOTHING
