-- Parameters: $1 = apartment count, $2 = years of history
INSERT INTO
  "AnnualCostSettlement" (
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
  'perf-as-' || n || '-' || y,
  'perf-apt-' || n,
  make_date(y, 1, 1),
  make_date(y, 12, 31),
  make_date(y + 1, 1, 29),
  'Perf Owner ' || n,
  'perf-koszty-' || y || '.pdf',
  -194,
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
  ) AS y
ON CONFLICT ("apartmentId", "periodFrom", "periodTo") DO NOTHING
