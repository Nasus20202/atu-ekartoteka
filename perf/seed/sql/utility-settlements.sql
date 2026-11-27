-- Parameters: $1 = apartment count, $2 = years of history, $3 = periods a year
INSERT INTO
  "UtilitySettlement" (
    id,
    "apartmentId",
    "periodFrom",
    "periodTo",
    "issuedOn",
    "printedOwner",
    "sourceFileName",
    "totalAmount",
    "createdAt",
    "updatedAt"
  )
SELECT
  'perf-us-' || n || '-' || y || '-' || p,
  'perf-apt-' || n,
  period_from,
  period_from + make_interval(months => 12 / $3::int) - INTERVAL '1 day',
  period_from + make_interval(months => 12 / $3::int),
  'Perf Owner ' || n,
  'perf-media-' || y || '.pdf',
  -287.8,
  NOW(),
  NOW()
FROM
  generate_series(1, $1::int) AS n,
  generate_series(
    EXTRACT(
      YEAR
      FROM
        NOW()
    )::int - $2::int + 1,
    EXTRACT(
      YEAR
      FROM
        NOW()
    )::int
  ) AS y,
  generate_series(1, $3::int) AS p,
  LATERAL (
    SELECT
      make_date(y, (p - 1) * (12 / $3::int) + 1, 1)::timestamp AS period_from
  ) AS period
ON CONFLICT ("apartmentId", "periodFrom", "periodTo") DO NOTHING
