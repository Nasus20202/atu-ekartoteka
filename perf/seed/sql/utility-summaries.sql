INSERT INTO
  "UtilitySettlementSummary" (
    id,
    "settlementId",
    "lineNo",
    code,
    consumption,
    "advanceQuantity",
    difference,
    amount
  )
SELECT
  s.id || '-s' || v.line_no,
  s.id,
  v.line_no,
  v.code,
  v.consumption,
  v.advance,
  v.consumption - v.advance,
  v.amount
FROM
  "UtilitySettlement" AS s
  CROSS JOIN (
    VALUES
      (1, 'CW', 14.2, 20.0, -169.6),
      (2, 'ZW', 27.4, 25.0, 28.8),
      (3, 'CO', 5.5, 30.0, -147.0)
  ) AS v (line_no, code, consumption, advance, amount)
WHERE
  s.id LIKE 'perf-us-%'
ON CONFLICT ("settlementId", "lineNo") DO NOTHING
